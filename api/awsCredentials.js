'use strict'


const fs = require('fs')
const ini = require('ini')
const _ = require('lodash')
const colors = require('colors')
const Docker = require('dockerode')
const docker = new Docker();

const AWS = require('aws-sdk')
let sts = new AWS.STS()
let iam = new AWS.IAM()

const Datastore = require('nedb')



const db = new Datastore({ filename: 'tmp/data.db', autoload: true });
db.containers = new Datastore({ filename: 'tmp/containers.db', autoload: true });
db.roles = new Datastore({ filename: 'tmp/roles.db', autoload: true });
db.profile = new Datastore({ filename: 'tmp/profile.db', autoload: true });


const AWSCredentials = (function() {
  const credentials = ini.parse(fs.readFileSync(process.env.HOME + '/.aws/credentials', 'utf-8'))
  let currentProfile = ""


  var getMFADevice = function() {
    iam = new AWS.IAM()
    return iam.listMFADevices().promise()
  }
  var setMFAAuth = function(serial, token) {
    const params = {
      DurationSeconds: 129600,
      SerialNumber: serial,
      TokenCode: token
    }
    sts = new AWS.STS()
    return sts.getSessionToken(params).promise()
  }
  var setAWSBase = function(cb) {
    db.profile.findOne({currentProfile: true}, function(err, data) {
      let profileObj = data
      if(Date.parse(data.Expiration) > new Date().getTime()) {
        AWS.config.credentials = new AWS.Credentials(data.AccessKeyId, data.SecretAccessKey, data.SessionToken)
      }else {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: profileObj.profileName})
      }
      if(typeof(cb) === 'function') {
        cb()
      }
    })

  }
  var getContainerByIp = function(ipAddress, cb) {
    docker.listContainers({all: true}, function(err, containers) {
      let matchingContainer = _.filter(containers, function(container) {
        try {
          return container.State === 'running' && container.NetworkSettings.Networks.bridge.IPAddress === ipAddress
        }catch(err) {}
      })
      matchingContainer = docker.getContainer(matchingContainer[0].Id)
      matchingContainer.inspect(function(err, res) {
        if(typeof(cb) === 'function' && !err) {
          cb(null, res)
        }else {
          cb(err)
        }
      })
    });
  }
  var getCredObject = function(dbObj) {
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
  var getContainerRole = function(container) {
    let envVars = container.Config.Env
    return _.chain(envVars).filter(function(env) {
      return _.includes(env, 'IAM_ROLE')
    }).map(function(env) {
      return _.split(env, '=')[1]
    }).value()[0]
  }
  var refreshCredentials = function(ipAddress, cb) {

    db.containers.findOne({ip: ipAddress}, function(err, container) {
      // get and set the proper role
      if (!err && container.roleArn) {
        console.log(colors.yellow("Creds expired for "+container.containerName+", refreshing them."))
        let new_sts = new AWS.STS()
        new_sts.assumeRole({
          DurationSeconds: 3600,
          RoleArn: container.roleArn,
          RoleSessionName: container.containerName
        }, function(err, res) {

          if(!err && res.Credentials) {
            db.containers.update({ip: container.ip}, {$set: res.Credentials}, {upsert: true}, function(errdb, resdb) {
              cb(err, res.Credentials)
            })
          }else {
            console.log(colors.red(err, res))
            cb(err, res)
          }
        })
      }
    })
  }
  var refreshRoles = function() {
    console.log(colors.green("refreshing roles..."))
    const iam = new AWS.IAM()
    let params = {}
    function getRoles(newParams) {
      iam.listRoles(newParams, function(err, data) {
        if(!err) {
          _.each(data.Roles, function(role) {
            db.roles.update({RoleName: role.RoleName}, {$set: role}, {upsert: true}, function(err, res) {})
          })
          if(data.IsTruncated && !_.isEmpty(data.Roles)) {
            getRoles({Marker: data.Marker})
          }else {
            console.log(colors.green('Done.'))
          }
        }else {
          console.log(colors.red(err))
        }
      })
    }
    getRoles(params)
  }
  var init = function() {
    db.profile.findOne({currentProfile: true}, function(err, data) {

      if(!_.isEmpty(data)) {
        currentProfile = data.profileName
        AWS.config.credentials = new AWS.Credentials(data.AccessKeyId, data.SecretAccessKey, data.SessionToken)
      }else {
        AWS.config.credentials = new AWS.SharedIniFileCredentials()
        if(AWS.config.credentials.accessKeyId) {
          refreshRoles()
        }else {
          console.log("Unable to assume default creds. You'll have to do that in the UI.")
        }
      }
    })
  }

  init()
  return {
    filterContainers: function(containers, cb) {
      // if container is running
      // set MFA authed or not.

      let all_containers = _.map(JSON.parse(containers), function(val) {

        let container = val
        container.AuthStatus = {'authed': false, state: 'none'}
        return new Promise(function(resolve, reject) {
          try {
            if(container.State === 'running') {

              db.containers.findOne({ip: container.NetworkSettings.Networks.bridge.IPAddress}, function(err, res) {
                if(res) {
                  if(Date.parse(res.Expiration) > new Date().getTime()) {
                    container.AuthStatus = {'authed': true, state: 'active'}
                    resolve(container)
                  }
                }
                resolve(container)
              })
            }else {
              resolve(container)
            }
          }catch(err) {
            resolve(container)
          }

        })
      })
      Promise.all(all_containers).then(values => {
        let filtered_containers = _.reject(values, function(val) {
          return val.Names[0] === '/docker-friend' || val.Names[0] === '/docker-friend-nginx'
        })
        cb(null, filtered_containers)
      })

    },
    getProfileNames: function() {
      return _.map(credentials, function(val, key) {
        return key
      })
    },
    setProfile: function(profileName, cb) {
      currentProfile = profileName
      db.profile.update({currentProfile: true}, {$set:{currentProfile: false}}, function(err, data) {
        db.profile.update({profileName: profileName}, {$set: {profileName: profileName, currentProfile: true}}, { upsert: true },function(err, data) {
          setAWSBase(cb)
        })
      })
    },
    mfaAuth: function(mfa, cb) {
      getMFADevice()
        .then(function(res) {
          let sn = res.MFADevices[0].SerialNumber
          console.log('sn = ' + sn)
          setMFAAuth(sn, mfa).then(function(res) {
            let extraSec = {
              SerialNumber: sn,
              TokenCode: mfa
            }
            db.profile.update({ profileName: currentProfile }, {$set: _.assignIn(res.Credentials, extraSec)}, { upsert: true }, function (err, data) {
              if(err) {
                console.log(colors.red('error updating database for profile'))
                cb(err)
              }else {
                setAWSBase()
                refreshRoles()
                cb(data)
              }
            });
          }).catch(function(err) {
            console.log(colors.red('error setting MFA Auth'))
            console.log(colors.yellow(err))
            cb(err)
          })
        })
        .catch(function(err) {
          console.log(colors.red('error getting MFA device'))
          console.log(err)
          cb(err)
        })

    },
    setProfile: function(profileName, cb) {
      currentProfile = profileName
      // set aws profile credentials
      db.profile.update({currentProfile: true}, {$set:{currentProfile: false}}, function(err, data) {
        db.profile.update({profileName: profileName}, {$set: {profileName: profileName, currentProfile: true}}, { upsert: true },function(err, data) {
          setAWSBase(cb)
        })
      })
    },
    getRoleName: function(ipAddress, cb) {
      // get the role name by IP and return it
      getContainerByIp(ipAddress, function(err, container) {
        let role = getContainerRole(container)
        if (role) {
          // make sure we have this role populated with proper info
          db.roles.findOne({RoleName: role}, function(err, res) {
            if(err) {
              console.log(colors.red("Unable to locate a AWS profile to use."))
              console.log(colors.green("Click on the upper right profile button, and choose which profile you'd like to assume the role of your container with."))
              // send message to the error bus
            }
            db.containers.update({ip: ipAddress}, {$set: {
              containerName: container.Name.replace('/', '')
            }}, {upsert: true}, function(errUpdate, resUpdate) {
              cb(role || err)
            })
          })
        }else {
          console.log('No role associated with ' + container.Name)
          cb(res)
          // db.containers.update({ip: ipAddress}, {$set: {
          //   roleName: "",
          //   roleArn: "",
          //   containerName: container.Name.replace('/', '')
          // }}, {upsert: true}, function(err, res) {
          //   cb(res)
          // })
        }
      })

    },
    getCreds: function(ipAddress, newRoleName, cb) {


      // find the old container
      db.containers.findOne({ip: ipAddress}, function(err, old_container) {
        // match the incoming role to an arn

        db.roles.findOne({RoleName: newRoleName}, function(err, foundRole) {
          // set up current role no matter what
          if(foundRole) {
            if(_.isEmpty(old_container) || Date.parse(old_container.Expiration) < new Date().getTime() || old_container.roleName !== newRoleName) {

              db.containers.update({ip: ipAddress}, {$set: {
                roleName: foundRole.RoleName,
                roleArn: foundRole.Arn
              }}, {upsert: true}, function(err, res) {
                refreshCredentials(ipAddress, function(err, res) {
                  cb(null, getCredObject(res))
                })
              })
            }else {
              console.log(old_container)
              cb(null, getCredObject(old_container))
            }
          }else {
            console.log(colors.red('Could not find role of name '+newRoleName +' in this account.'))
          }

        })
      })
    }

  }
})()

module.exports = AWSCredentials
