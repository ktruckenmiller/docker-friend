'use strict'

import fs from 'fs'
import ini from 'ini'
import colors from 'colors'
import Docker from 'dockerode'
import AWS from 'aws-sdk'
import { findOne, update } from './database'
import {
  isString,
  concat,
  map,
  assignIn,
  pluck,
  omit,
  filter,
  chain,
  includes,
  split,
  reject
} from 'lodash'

const docker = new Docker();




class AWSCreds {

  constructor (profileName = 'default') {
    // Private Vars
    this._availableProfiles = ini.parse(fs.readFileSync(process.env.HOME + '/.aws/credentials', 'utf-8'))
    this._sts = new AWS.STS()
    this._iam = new AWS.IAM()
    this._userObj = {
      currentProfile: profileName,
      baseCreds: new AWS.SharedIniFileCredentials({profile: profileName}),
      mfaDevice: ''
    }
    // if we want to do a config file, we should make sure and load the base
    // that the config requires instead
    AWS.config.credentials = this._userObj.baseCreds
    this._roles = []
  }
  async init () {
    await this.setBaseProfile()
  }
  baseProfileSet () {
    if (isString(this._userObj.baseCreds.accessKeyId)) {
      return true
    } else {
      return false
    }
  }
  hasCredentialsSet () {

  }
  async getProfile() {
    let tokens = await findOne('profile', {currentProfile: true})
    if (tokens) {

    }
  }
  getRoles () {
    if (!this.baseProfileSet()) {return []}
    let roles = []
    return new Promise((resolve, reject) => {
      this._iam = new AWS.IAM()
      this._iam.listRoles({}).eachPage((err, data, done) => {
        if (err) {
          reject(err)
        }
        if (data) {
          roles = concat(roles, data.Roles)
          done(true)
        } else {
          resolve(roles)
          done()
        }
      })
    })
  }
  async setRoles (roles) {
    let newRoles = map(roles, (role) => {
      return update('roles', {RoleName: role.RoleName, profile: this._userObj.currentProfile}, {$set: assignIn(role, {profile: this._userObj.currentProfile})}, {upsert: true})
    })
    let res = await Promise.all(newRoles)
    return res
  }
  async getRole (name) {
    return await findOne('roles', {RoleName: name, profile: this._userObj.currentProfile})
  }
  getMFADevice () {
    if (!this.baseProfileSet()) {return}
    return new Promise((resolve, reject) => {
      AWS.config.credentials = this._userObj.baseCreds
      this._iam = new AWS.IAM()
      this._iam.listMFADevices({}, (err, data) => {
        if(err) {reject(err)}
        this._userObj.mfaDevice = data.MFADevices[0].SerialNumber
        resolve(this._userObj.mfaDevice)
      })
    })
  }

  async getSessionToken (token = false) {
    let hasMFADevice = await this.getMFADevice()
    if (!hasMFADevice || !token) {return {err: true}}
    this._sts = new AWS.STS()
    const params = {
      DurationSeconds: 129600,
      SerialNumber: hasMFADevice,
      TokenCode: String(token)
    }
    try {
      let res = await this._sts.getSessionToken(params).promise()
      return assignIn(res.Credentials, params)
    } catch (e) {
      return {err: true}
    }
  }



  // public
  async setMFA (token) {

    let credentials = await this.getSessionToken(token)
    if (credentials.err) {return "Cant set creds"}

    await update('profile', {
      profileName: this._userObj.currentProfile
    }, {
      $set: omit(credentials, ['DurationSeconds'])
    }, { upsert: true })
    this.setBaseProfile()
  }
  profileMfaExpired (profileInQuestion) {
    try {
      return Date.parse(profileInQuestion.Expiration) < new Date().getTime()
    } catch (e) {return true}
  }
  async setBaseProfile () {
    // if we have a cached MFA session, let's look that up first
    let profileInQuestion = await findOne('profile', {profileName: this._userObj.currentProfile})
    if (this.profileMfaExpired(profileInQuestion)) {
      this._userObj.baseCreds = new AWS.SharedIniFileCredentials({profile: this._userObj.currentProfile})
      if (!this.baseProfileSet()) {return {err: true, msg: "This profile doesn't exist."}}
      AWS.config.credentials = this._userObj.baseCreds
    } else {
      this._userObj.baseCreds = new AWS.Credentials(
          profileInQuestion.AccessKeyId,
          profileInQuestion.SecretAccessKey,
          profileInQuestion.SessionToken
        )
      AWS.config.credentials = this._userObj.baseCreds
    }

    // could probably put this in to its
    let roles = await this.getRoles()
    await this.setRoles(roles)
    return this.baseProfileSet()
  }

  getProfileNames () {
    return map(this._availableProfiles, (val, key) => {
      return key
    })
  }
  getCredObject (dbObj) {
    let date = new Date()
    let newObj = {
      Code: "Success",
      "Type": "AWS-HMAC",
      LastUpdated: date.toISOString().substring(0,19)+'Z',
      AccessKeyId: dbObj.AccessKeyId,
      Expiration: dbObj.Expiration.toISOString().substring(0,19)+'Z',
      SecretAccessKey: dbObj.SecretAccessKey,
      Token: dbObj.SessionToken
    }
    return newObj
  }

  async getContainerByIp (ipAddress) {
    let matchingContainer = filter((await docker.listContainers({all: true})), (container) => {
      try {
        if (container.State === 'running') {
          let network = Object.keys(container.NetworkSettings.Networks)[0]
          return container.NetworkSettings.Networks[network].IPAddress === ipAddress
        }
      }catch(err) {}
    })

    matchingContainer = docker.getContainer(matchingContainer[0].Id)
    return await new Promise((resolve, reject) => {
      matchingContainer.inspect((err, res) => {
        if (err) {reject(err)}
        else {resolve(res)}
      })
    })
  }

  async getContainerRoleNameByIp (ipAddress) {
    let container = await this.getContainerByIp(ipAddress)
    let role = await this.getContainerRole(container)
    if (!role) { return {err: true, msg: "No role associated with this container. Set it by using `-e IAM_ROLE=my-role` on the container run."}}
    return role
  }

  getContainerRole (container) {
    let envVars = container.Config.Env
    return chain(envVars)
    .filter((env) => {
      return includes(env, 'IAM_ROLE')
    }).map((env) => {
      return split(env, '=')[1]
    }).value()[0]
  }

  credsExpired (expiration) {
    return Date.parse(expiration) < new Date().getTime()
  }

  async assumeContainerRole (roleDetails) {
    // if userObj expired, tell user to refresh MFA
    // else assume container role  and store with role
    let assumedRole
    try {
       assumedRole = await this._sts.assumeRole({
        DurationSeconds: 3600,
        RoleArn: roleDetails.Arn,
        RoleSessionName: 'docker-friend'
      }).promise()
      let newDetails =
      await update('roles', {
        RoleName: roleDetails.RoleName,
        profile: this._userObj.currentProfile
      }, {
        $set: assignIn(roleDetails, {TempCreds: assumedRole.Credentials})
      }, {
        upsert: true
      })
      return
    }catch (e) {
      return {err: true, msg: e}
    }
    // store in database next to the role

  }

  async containerRoleRequest (ipAddress) {
    let roleFail
    let role = await this.getContainerRoleNameByIp(ipAddress)
    let roleDetails = await findOne('roles', {RoleName: role, profile: this._userObj.currentProfile})
    // if expired or no creds, refresh

    try {
      if (this.credsExpired(roleDetails.TempCreds.Expiration)) {
        roleFail = await this.assumeContainerRole(roleDetails)
      } else {
        return this.getCredObject(roleDetails.TempCreds)
      }
    } catch (e) {
      roleFail = await this.assumeContainerRole(roleDetails)
    }
    roleDetails = await findOne('roles', {RoleName: role, profile: this._userObj.currentProfile})

    if (roleDetails.TempCreds) {
      return this.getCredObject(roleDetails.TempCreds)
    } else {
      return roleFail
    }
  }
  filterContainers (containers) {
    let filtered = reject(JSON.parse(containers), (val) => {
      return val.Names[0] === '/docker-friend' || val.Names[0] === '/docker-friend-nginx'
    })

    filtered = map(filtered, (val) => {
      val.AuthStatus = {'authed': false, state: 'none'}
      return val
    })
    return filtered
  }
}
export { AWSCreds }

// const AWSCredentials = (function() {

  // const refreshCredentials = function(ipAddress, cb) {
  //
  //   db.containers.findOne({ip: ipAddress}, function(err, container) {
  //     // get and set the proper role
  //     if (!err && container.roleArn) {
  //       console.log(colors.yellow("Creds expired for "+container.containerName+", refreshing them."))
  //       sts = new AWS.STS()
  //       sts.assumeRole({
  //         DurationSeconds: 3600,
  //         RoleArn: container.roleArn,
  //         RoleSessionName: container.containerName
  //       }, function(err, res) {
  //
  //         if(!err && res.Credentials) {
  //           db.containers.update({ip: container.ip}, {$set: res.Credentials}, {upsert: true}, function(errdb, resdb) {
  //             cb(err, res.Credentials)
  //           })
  //         }else {
  //           console.log(colors.red(err, res))
  //           cb(err, res)
  //         }
  //       })
  //     }
  //   })
  // }
  // return {
    // async filterContainers (containers, cb) {
    //   // if container is running
    //   // set MFA authed or not.
    //   let filtered_containers = JSON.parse(containers)
    //   let all_containers = _.map(filtered_containers, function(val) {
    //
    //     let container = val
    //     container.AuthStatus = {'authed': false, state: 'none'}
    //     // instead of doing a promise here, maybe push this into a separate function
    //     // in our db calls to figure this out and return it
    //     return new Promise(function(resolve, reject) {
    //       try {
    //         if(container.State === 'running') {
    //
    //           db.containers.findOne({ip: container.NetworkSettings.Networks.bridge.IPAddress}, function(err, res) {
    //             if(res) {
    //               if(Date.parse(res.Expiration) > new Date().getTime()) {
    //                 container.AuthStatus = {'authed': true, state: 'active'}
    //                 resolve(container)
    //               }
    //             }
    //             resolve(container)
    //           })
    //         }else {
    //           resolve(container)
    //         }
    //       }catch(err) {
    //         resolve(container)
    //       }
    //
    //     })
    //   })
    //   Promise.all(all_containers).then(values => {
    //     let filtered_containers = _.reject(values, function(val) {
    //       return val.Names[0] === '/docker-friend' || val.Names[0] === '/docker-friend-nginx'
    //     })
    //     cb(null, filtered_containers)
    //   })
    //
    // },
//
//   }
// })()
//
// module.exports = AWSCredentials
