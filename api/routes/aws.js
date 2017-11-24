const awsCreds = require('../awsCredentials').awsCreds
import { update } from '../awsRoles'
import {throwError} from '../errorSockets'
import {ECS} from './ecs'
import AWS from 'aws-sdk'


import Bounce from 'bounce'
const ecs = new ECS()
// awsCreds.init()
module.exports = [{
    method: 'GET',
    path: '/aws/currentProfile',
    handler: async (request, reply) => {
      let profile = await awsCreds.getProfile()
      reply(profile)
    }
  },{
    method: 'GET',
    path: '/aws/clusters',
    handler: (request, reply) => {
      let ecs = new AWS.ECS({region: 'us-west-2'})
      let clusters = ecs.listClusters({}, (err, res) => {
        if(err) {return reply(err)}
        reply(res.clusterArns)
      })
    }
  },{
    method: 'GET',
    path: '/aws/cluster/{clusterName}',
    handler: async (request, reply) => {
      try {
        reply(await ecs.clusterDetails(request.params.clusterName))
      }catch(e) {
        console.log(e)
        reply(e)
      }



    }
  },{
    method: 'POST',
    path: '/aws/setProfile',
    handler: (request, reply) => {

    }
  },{
    method: 'GET',
    path: '/aws/profiles',
    handler: async (request, reply) => {
      console.log(awsCreds.getProfileNames())
      let profiles = awsCreds.getProfileNames()
      reply(profiles)
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
      console.log('requesting ')
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

      try {
        let res = await awsCreds.containerRoleRequest(request.info.remoteAddress)
        console.log(`Returning creds to ${request.info.remoteAddress}`)
        reply(res)
      } catch (e) {
        console.log(e)
        throwError(e)
        console.log('replying with' + e)
        reply(e)

      }
    }
  }]
