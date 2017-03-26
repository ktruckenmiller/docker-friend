'use strict'


const fs = require('fs')
const ini = require('ini')
const _ = require('lodash')
const Docker = require('dockerode')
const docker = new Docker();

const AWS = require('aws-sdk')
const sts = new AWS.STS()
const iam = new AWS.IAM()

const Datastore = require('nedb')



const db = new Datastore({ filename: 'tmp/data.db', autoload: true });
db.containers = new Datastore({ filename: 'tmp/containers.db', autoload: true });
db.roles = new Datastore({ filename: 'tmp/roles.db', autoload: true });
db.profile = new Datastore({ filename: 'tmp/profile.db', autoload: true });


const AWSCredentials = (function() {
  const config = ini.parse(fs.readFileSync(process.env.HOME + '/.aws/config', 'utf-8'))
  const credentials = ini.parse(fs.readFileSync(process.env.HOME + '/.aws/credentials', 'utf-8'))
  let currentProfile = ""



  var getMFADevice = function() {
    return iam.listMFADevices().promise()
  }
  var setMFAAuth = function(serial, token) {
    const params = {
      DurationSeconds: 129600,
      SerialNumber: serial,
      TokenCode: token
    }
    return sts.getSessionToken(params).promise()
  }
  var setAWSBase = function(cb) {
    db.profile.find({currentProfile: true}, function(err, data) {
      let profileObj = data[0]
      let new_creds = new AWS.SharedIniFileCredentials({profile: profileObj.profileName})
      AWS.config.credentials = new_creds
      refreshRoles()
      if(typeof(cb) === 'function') {
        cb()
      }else {

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
    let newObj = _.assignIn({Code: "Success", "Type": "AWS-HMAC", LastUpdated: new Date().toISOString()}, _.pick(dbObj, ['AccessKeyId', 'Expiration', 'SessionToken', 'SecretAccessKey']))
    return _.chain(newObj).assignIn({Token: newObj.SessionToken}).omit('SessionToken').value()
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
    console.log("Creds expired, refreshing it")
    db.containers.findOne({ip: ipAddress}, function(err, container) {
      if (!err && container.roleArn) {
        sts.assumeRole({
          DurationSeconds: 3600,
          RoleArn: container.roleArn,
          RoleSessionName: container.containerName
        }, function(err, res) {

          if(!err && res.Credentials) {
            db.containers.update({ip: container.ip}, {$set: res.Credentials}, {upsert: true}, function(errdb, resdb) {
              cb(err, res.Credentials)
            })
          }else {
            cb(err, res)
          }
        })
      }else {

      }
    })
  }
  var refreshRoles = function() {
    iam.listRoles().eachPage(function (err, data, done) {
      if(data) {
        _.each(data.Roles, function(role) {
            db.roles.update({RoleName: role.RoleName}, {$set: role}, {upsert: true}, function(err, res) {})
            done()
        })
      }else {
        done()
      }
    });
  }
  var init = function() {

    db.containers.find({}, function(err, data) {
      // console.log(data)
    })
    db.profile.find({currentProfile: true}, function(err, data) {
      if(!_.isEmpty(data)) {
        currentProfile = data[0].profileName
        refreshRoles()
      }
    })
  }

  init()
  return {
    getProfileNames: function() {
      return _.map(credentials, function(val, key) {
        return key
      })
    },
    mfaAuth: function(mfa, cb) {
      getMFADevice()
        .then(function(res) {
          let sn = res.MFADevices[0].SerialNumber
          setMFAAuth(sn, mfa).then(function(res) {
            db.profile.update({ profileName: currentProfile }, {$set: res.Credentials}, { upsert: true }, function (err, data) {
              if(err) {
                cb(err)
              }else {
                cb(data)
              }
            });
          }).catch(function(err) {
            cb(err)
          })
        })
        .catch(function(err) {
          cb(err)
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
    getRoleName: function(ipAddress, cb) {
      // get the role name by IP and return it
      getContainerByIp(ipAddress, function(err, container) {
        let role = getContainerRole(container)
        if (role) {
          // make sure we have this role populated with proper info
          db.roles.findOne({RoleName: role}, function(err, res) {

            if(!err && res) {
              db.containers.update({ip: ipAddress}, {$set: {
                roleName: role,
                roleArn: res.Arn,
                containerName: container.Name.replace('/', '')
              }}, {upsert: true}, function(errUpdate, resUpdate) {
                cb(role)
              })
            }else {
              console.log("You'll have to log in.")
              // send message to the error bus
              cb(err)
            }
          })
        }else {
          cb(res)
          console.log('No role associated with ' + container.Name)
        }
      })

    },
    getCreds: function(ipAddress, cb) {
      db.containers.findOne({ip: ipAddress}, function(err, container) {
        if(_.isEmpty(container)) {
          refreshCredentials(ipAddress, function(err, res) {
            cb(null, getCredObject(res))
          })
        }else if(Date.parse(container.Expiration) > Date.now()) {
          cb(null, getCredObject(container))
        } else {

          refreshCredentials(ipAddress, function(err, res) {
            cb(null, getCredObject(res))
          })
        }
      })
    }
  }
})()

module.exports = AWSCredentials
