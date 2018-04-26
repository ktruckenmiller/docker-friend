'use strict'
import fs from 'fs'
import ini from 'ini'
import colors from 'colors'
import Docker from 'dockerode'
import AWS from 'aws-sdk'
import { throwError } from './errorSockets'
import Bounce from 'bounce'

import { findOne, update } from './database'

import {
  isString,
  isObject,
  concat,
  map,
  has,
  assignIn,
  pluck,
  omit,
  filter,
  chain,
  includes,
  last,
  split,
  reject
} from 'lodash'

const docker = new Docker();




class AWSCreds {
  constructor () {
    // Private Vars
    this._sts = new AWS.STS()
    this._iam = new AWS.IAM()
    this._roles = []
    this.update = update
    this.findOne = findOne
  }
  checkAWSProfiles (profileName) {
    return new Promise((resolve, reject) => {
      let profiles = ini.parse(fs.readFileSync(process.env.HOME + '/.aws/credentials', 'utf-8'))
      if (!has(profiles, profileName)) {

        throw Error(`No profile with this name: ${profileName}`)
      } else {
        resolve(profiles)
      }
    })
  }
  getProfileNames () {
    return map(ini.parse(fs.readFileSync(process.env.HOME + '/.aws/credentials', 'utf-8')), (val, key) => {
      return key
    })
  }
  async init (profileName = 'default') {
    this._availableProfiles = this.checkAWSProfiles(profileName)
    this._userObj = {
      currentProfile: profileName,
      mfaDevice: ''
    }
    let profileObj = await this.findOne('profile', {currentProfile: true})
    if (isObject(profileObj)) {
      // found a profile that we're Using
      profileName = profileObj.profileName
    }

    try {
      await this.setBaseProfile(profileName)
    } catch(err) {
      throw new Error(err)
    }
  }
  baseProfileSet () {
    if (isString(this._userObj.baseCreds.accessKeyId)) {
      return true
    } else {
      return false
    }
  }
  async getProfile() {
    let profile = await this.findOne('profile', {currentProfile: true})
    if (this.profileMfaExpired(profile)) {
      return
    } else {
      return profile
    }

  }
  getRoles () {
    if (!this.baseProfileSet()) {return []}
    let roles = []
    console.log('Refreshing iam roles...')
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
      return this.update('roles', {
          RoleName: role.RoleName,
          profile: this._userObj.currentProfile
        }, {$set: assignIn(role, {
          profile: this._userObj.currentProfile
        })}, {upsert: true})
    })
    let res = await Promise.all(newRoles)
    console.log('Refreshed all IAM roles.')
    return res
  }
  async getRole (name) {
    return await this.findOne('roles', {RoleName: name, profile: this._userObj.currentProfile})
  }
  getMFADevice () {
    if (!this.baseProfileSet()) {throw new Error('You do not have a base profile selected.')}

    return new Promise((resolve, reject) => {
      AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: this._userObj.currentProfile})
      this._iam = new AWS.IAM()
      this._iam.listMFADevices({}, (err, data) => {
        // if(err) {reject(err)}
        if(!data || err) {
          return reject(new Error(`No mfa device detected with the \'${this._userObj.currentProfile}\' AWS profile, or that profile doesn\'t have the permission to list MFA devices.`))
        }
        this._userObj.mfaDevice = data.MFADevices[0].SerialNumber
        resolve(this._userObj.mfaDevice)
      })
    })
  }

  async getSessionToken (token = false) {
    let params = {
      DurationSeconds: 3600
    }
    if(token) {
      let hasMFADevice = await this.getMFADevice()
      if(!hasMFADevice) {throw new Error('Profile does not have an MFA device detected.')}
      params = assignIn(params, {
        SerialNumber: hasMFADevice,
        TokenCode: String(token),
        DurationSeconds: 129600
      })
    }
    this._sts = new AWS.STS()
    let res = await this._sts.getSessionToken(params).promise()
    return assignIn(res.Credentials, params)
  }



  // public
  async setMFA (token) {
    let credentials = await this.getSessionToken(token)
    if (credentials.AccessDenied) {
      throw new Error(credentials)
    }

    await this.update('profile', {
      currentProfile: true
    },{
      $set: {currentProfile: false}
    }, {upsert: true})
    await this.update('profile', {
      profileName: this._userObj.currentProfile
    }, {
      $set: assignIn(omit(credentials, ['DurationSeconds']), {currentProfile: true})
    }, { upsert: true })
    this.setBaseProfile()
  }
  profileMfaExpired (profileInQuestion) {
    try {
      return this.credsExpired(profileInQuestion.Expiration)
    } catch (e) {return true}
  }
  async setBaseProfile (profile = false) {
    this._userObj.currentProfile = profile || this._userObj.currentProfile
    // if we have a cached MFA session, let's look that up first'
    let profileInQuestion = await this.findOne('profile', {profileName: this._userObj.currentProfile})

    if (this.profileMfaExpired(profileInQuestion)) {
      this._userObj.baseCreds = new AWS.SharedIniFileCredentials({profile: this._userObj.currentProfile})
      console.log('Using base credentials')
      if (!this.baseProfileSet()) { throw new Error("This profile doesn't exist.")}
      AWS.config.credentials = this._userObj.baseCreds
    } else {

      this._userObj.baseCreds = new AWS.Credentials(
          profileInQuestion.AccessKeyId,
          profileInQuestion.SecretAccessKey,
          profileInQuestion.SessionToken
        )
      console.log('Using session elevated MFA credentials')
      AWS.config.credentials = this._userObj.baseCreds
    }

    // could probably put this in to its
    let roles = await this.getRoles()
    await this.setRoles(roles)
    return this.baseProfileSet()
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

  getContainerByIp (ipAddress) {
    return new Promise((resolve, reject) => {
      docker.listContainers({all: true}, function(err, containers) {
        if(err) {
          return reject(err)
        }
        let matchingContainer = filter((containers), (container) => {

            if (container.State === 'running') {
              let network = Object.keys(container.NetworkSettings.Networks)[0]
              return container.NetworkSettings.Networks[network].IPAddress === ipAddress
            }

        })
        matchingContainer = docker.getContainer(matchingContainer[0].Id)
        matchingContainer.inspect((err, res) => {
          if (err) {
            return reject(err)
          }
          return resolve(res)
        })
      })
    })
  }

  async getContainerRoleNameByIp (ipAddress, getArn = false) {
    try {
      let container = await this.getContainerByIp(ipAddress)
      let roleName = await this.getContainerRoleName(container, getArn)
      if(!isString(roleName)) {
        throwError("No role associated with this container. Set it by using `-e IAM_ROLE=my-role` or `-e IAM_ROLE_ARN=arn:aws:iam::<account>:role/your-role` on the container run.")
        throw new Error("No role associated with this container. Set it by using `-e IAM_ROLE=my-role` or `-e IAM_ROLE_ARN=arn:aws:iam::<account>:role/your-role` on the container run.")
      }
      return roleName
    }catch(err) {
      Bounce.rethrow(err, 'system');
      throwError(err)
      throw new Error(err)
    }

  }
  async getContainerRoleArnByIp (ipAddress) {
    let container = await this.getContainerByIp(ipAddress)
    return await this.getContainerRoleArn(container)
  }

  getContainerRoleArn (container) {
    let envVars = container.Config.Env
    let roleArn = chain(envVars)
      .filter((env) => {
        return includes(env, 'IAM_ROLE_ARN')
      }).value()
    if (roleArn.length > 0) {
      return split(roleArn[0], '=')[1]
    }
  }


  getContainerRoleName (container, isArn) {
    let envVars = container.Config.Env
    return chain(envVars)
    .filter((env) => {
      return includes(env, 'IAM_ROLE')
    }).map((env) => {
      let r = split(env, '=')[1]
      if(isArn) {
        return r
      } else {
        return last(split(r, '/'))
      }

    }).value()[0]
  }

  credsExpired (expiration) {
    // if(!isString(expiration)) { throw new Error(`Cred expiration: ${expiration} is not a date.`)}
    return Date.parse(expiration) < new Date().getTime()
  }

  async assumeContainerRole (roleDetails, dryRun = false) {
    // Get new sts object based on potential base credentials
    if ( !dryRun ) { this._sts = new AWS.STS() }
    let assumedRole, roleUpdateObj
    assumedRole = await this._sts.assumeRole({
      DurationSeconds: 3600,
      RoleArn: roleDetails.Arn,
      RoleSessionName: 'docker-friend'
    }).promise()

    let newDetails = await this.update('roles', {
      _id: roleDetails._id
    }, {
      $set: assignIn(omit(roleDetails, '_id'), {TempCreds: assumedRole.Credentials})
    }, {
      upsert: true
    })
    return roleDetails._id
  }

  async containerRoleRequest (ipAddress) {

    let roleFail, roleDetails, roleArn, role
    // not getting past here
    try {
      role = await this.getContainerRoleNameByIp(ipAddress, true)

      // not getting role
      if(includes(role, "arn:aws:iam::")) {
        roleArn = role
        role = await this.getContainerRoleNameByIp(ipAddress)
      } else {
        roleArn = await this.getContainerRoleArnByIp(ipAddress)
      }
    }catch (err) {
      // Bounce.rethrow(err, 'system');
      throw new Error(err);
    }

    if(!isString(roleArn)) {
      throw new Error(`No role found in this account by this name: ${role}`)
    }
    // do we know if this is
    if (roleArn) {
      // find if already assumed
      roleDetails = await this.findOne('roles', {Arn: roleArn, profile: this._userObj.currentProfile})
      if (!roleDetails) {
        let roleDetails = await this.update('roles', {Arn: roleArn, profile: this._userObj.currentProfile}, {$set: {role: role}}, {upsert: true})
      }
      // if not, lets assume it
    } else {
      roleDetails = await this.findOne('roles', {RoleName: role, profile: this._userObj.currentProfile})
    }
    // if(!roleDetails) {
    //   throw new Error(`Role does not exist for ${role}`)
    // }


    // if expired or no creds, refresh
    try {
      if (this.credsExpired(roleDetails.TempCreds.Expiration)) {
        console.log('creds expired...')
      } else {
        console.log('creds not expired, returning')
        return this.getCredObject(roleDetails.TempCreds)
      }
    } catch (e) {
      console.log()
    }
    try {
      let roleId = await this.assumeContainerRole(roleDetails)
      roleDetails = await this.findOne('roles', {_id: roleId})
    }catch (e) {
      // Bounce.rethrow(e, 'system');
      throw new Error(e)
    }
    if (roleDetails.TempCreds) {
      return this.getCredObject(roleDetails.TempCreds)
    } else {
      throwError("Can't get tempcreds obj")
      throw new Error("can't get tmp creds object")
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

let obj = new AWSCreds()

module.exports.awsCreds = obj
