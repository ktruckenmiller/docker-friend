'use strict'

import fs from 'fs'
import ini from 'ini'
import colors from 'colors'
import Docker from 'dockerode'
import AWS from 'aws-sdk'
import server from './app'
import { throwError } from './errorSockets'


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
  last,
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
  async getProfile() {
    let profile = await findOne('profile', {currentProfile: true})
    if (this.profileMfaExpired(profile)) {
      return
    } else {
      return profile
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
      AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: this._userObj.currentProfile})
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
    this._sts = new AWS.STS()
    const params = {
      DurationSeconds: 129600,
      SerialNumber: hasMFADevice,
      TokenCode: String(token)
    }
    console.log('about to get session token with', params)
    let res = await this._sts.getSessionToken(params).promise()

    return assignIn(res.Credentials, params)

  }



  // public
  async setMFA (token) {
    let credentials = await this.getSessionToken(token)
    if (credentials.AccessDenied) {
      throw new Error(credentials)
    }
    await update('profile', {
      currentProfile: true
    },{
      $set: {currentProfile: false}
    }, {upsert: true})
    await update('profile', {
      profileName: this._userObj.currentProfile
    }, {
      $set: assignIn(omit(credentials, ['DurationSeconds']), {currentProfile: true})
    }, { upsert: true })
    this.setBaseProfile()
  }
  profileMfaExpired (profileInQuestion) {
    try {
      return Date.parse(profileInQuestion.Expiration) < new Date().getTime()
    } catch (e) {return true}
  }
  async setBaseProfile (profile = false) {
    this._userObj.currentProfile = profile || this._userObj.currentProfile
    // if we have a cached MFA session, let's look that up first
    let profileInQuestion = await findOne('profile', {profileName: this._userObj.currentProfile})
    if (this.profileMfaExpired(profileInQuestion)) {
      this._userObj.baseCreds = new AWS.SharedIniFileCredentials({profile: this._userObj.currentProfile})
      if (!this.baseProfileSet()) { throw new Error("This profile doesn't exist.")}
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
    let roleName = await this.getContainerRoleName(container)

    if (!roleName) { return {err: true, msg: "No role associated with this container. Set it by using `-e IAM_ROLE=my-role` or `-e IAM_ROLE_ARN=arn:aws:iam::<account>:role/your-role` on the container run."}}
    return roleName
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

  getContainerRoleName (container) {
    let envVars = container.Config.Env
    return chain(envVars)
    .filter((env) => {
      return includes(env, 'IAM_ROLE', 'IAM_ROLE_ARN')
    }).map((env) => {
      let r = split(env, '=')[1]
      return last(split(r, '/'))
    }).value()[0]
  }

  credsExpired (expiration) {
    return Date.parse(expiration) < new Date().getTime()
  }

  async assumeContainerRole (roleDetails) {
    // if userObj expired, tell user to refresh MFA
    // else assume container role  and store with role
    console.log('Assuming role...')
    let assumedRole
    try {
       assumedRole = await this._sts.assumeRole({
        DurationSeconds: 3600,
        RoleArn: roleDetails.Arn,
        RoleSessionName: 'docker-friend'
      }).promise()
      let newDetails = await update('roles', {
        RoleName: roleDetails.RoleName,
        profile: this._userObj.currentProfile
      }, {
        $set: assignIn(roleDetails, {TempCreds: assumedRole.Credentials})
      }, {
        upsert: true
      })
      return
    }catch (e) {
      throwError(e)
      return {err: true, msg: e}
    }
    // store in database next to the role

  }

  async containerRoleRequest (ipAddress) {
    let roleFail, roleDetails
    let role = await this.getContainerRoleNameByIp(ipAddress)
    let roleArn = await this.getContainerRoleArnByIp(ipAddress)

    if (roleArn) {
      // find if already assumed
      roleDetails = await findOne('roles', {Arn: roleArn, profile: this._userObj.currentProfile})
      if (!roleDetails) {
        let roleDetails = await update('roles', {Arn: roleArn, profile: this._userObj.currentProfile}, {$set: {role: role}}, {upsert: true})
      }
      // if not, lets assume it
    } else {
      roleDetails = await findOne('roles', {RoleName: role, profile: this._userObj.currentProfile})
    }


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
