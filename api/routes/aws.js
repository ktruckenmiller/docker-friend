import { AWSCreds } from '../awsCredentials'
const awsCreds = new AWSCreds()
awsCreds.init()
module.exports = [{
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
        profile = await awsCreds.setBaseProfile(request.payload.profile)
        authed = await awsCreds.setMFA(request.payload.mfa)
        reply()
      } catch (e) {
        reply({err: true, msg: {profile: profile, authed: authed}})
      }
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
