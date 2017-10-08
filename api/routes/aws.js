import { AWSCreds } from '../awsCredentials'
import { update } from '../awsRoles'
const awsCreds = new AWSCreds()
awsCreds.init()
module.exports = [{
    method: 'GET',
    path: '/aws/currentProfile',
    handler: function(request, reply) {
      reply()
    }
  },{
    method: 'GET',
    path: '/aws/profiles',
    handler: function(request, reply) {
      reply(awsCreds.getProfileNames())
    }
  }, {
    method: 'POST',
    path: '/aws/submitmfa',
    handler: async (request, reply) => {
      let profile, authed
      try {
        console.log('trying to set base profile')
        profile = await awsCreds.setBaseProfile(request.payload.profile)
      } catch (e) {
        return reply({err: true, msg: {profile: profile, authed: authed}})
      }
      try {
        console.log('trying to set mfa')
        authed = await awsCreds.setMFA(request.payload.mfa)
        console.log('settting mfa', authed)
        update(request.payload.profile)
      } catch (e) {
        return reply({err: true, msg: e})
      }
      return reply()

    }
  }, {
    method: 'GET',
    path: '/latest/meta-data/iam/security-credentials',
    handler: (request, reply) => {
      awsCreds.getContainerRoleNameByIp(request.info.remoteAddress).then(res => {
        reply(res)
      }).catch(err => {
        reply({err: true, msg: err})
      })
    }
  }, {
    method: 'GET',
    path: '/latest/meta-data/iam/security-credentials/{role}',
    handler: (request, reply) => {
      awsCreds.containerRoleRequest(request.info.remoteAddress).then(res => {
        reply(res)
      }).catch(err => {
        reply({err: true, msg: err})
      })
    }
  }]
