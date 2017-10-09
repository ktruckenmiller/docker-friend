import { AWSCreds } from '../awsCredentials'
import { update } from '../awsRoles'
const awsCreds = new AWSCreds()
awsCreds.init()
module.exports = [{
    method: 'GET',
    path: '/aws/currentProfile',
    handler: async (request, reply) => {
      let profile = await awsCreds.getProfile()
      console.log(profile)
      console.log('profile^^')
      reply(profile)
    }
  },{
    method: 'POST',
    path: '/aws/setProfile',
    handler: (request, reply) => {

    }
  },{
    method: 'GET',
    path: '/aws/profiles',
    handler: function(request, reply) {
      reply(awsCreds.getProfileNames())
    }
  },{
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
        authed = await awsCreds.setMFA(request.payload.mfa)
        update(request.payload.profile)
      } catch (e) {

        return reply({err: true, msg: e})
      }
      console.log(profile, authed)
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
    handler: async (request, reply) => {
      console.log(`Returning creds to ${request.info.remoteAddress}`)
      try {
        let res = await awsCreds.containerRoleRequest(request.info.remoteAddress)
        reply(res)
      } catch (e) {
        reply( {err: true, msg: e})
      }
      // .then(res => {
      //   reply(res)
      // }).catch(err => {
      //   reply({err: true, msg: err})
      // })
    }
  }]
