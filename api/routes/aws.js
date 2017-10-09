const AWS = require('../awsCredentials')

module.exports = [{
    method: 'GET',
    path: '/aws/profiles',
    handler: function(request, reply) {
      reply(AWS.getProfileNames())
    }
  }, {
    method: 'POST',
    path: '/aws/submitmfa',
    handler: function(request, reply) {
      AWS.setProfile(request.payload.profile, function() {
        AWS.mfaAuth(request.payload.mfa, function(res) {
          reply(request.payload)
        })
      })
    }
  }, {
    method: 'POST',
    path: '/aws/assumerole',
    handler: function(request, reply) {
      AWS.authContainer().then(function(res) {
        reply(res)
      }).catch(function(err) {reply(err)})
    }
  }, {
    method: 'GET',
    path: '/latest/meta-data/iam/security-credentials/',
    handler: function(request, reply) {
      AWS.getRoleName(request.info.remoteAddress, function(res) {
        reply(res)
      })
    }
  }, {
    method: 'GET',
    path: '/latest/meta-data/iam/security-credentials',
    handler: function(request, reply) {
      AWS.getRoleName(request.info.remoteAddress, function(res) {
        reply(res)
      })
    }
    },{
    method: 'GET',
    path: '/latest/meta-data/iam/security-credentials/{role}',
    handler: function(request, reply) {
      AWS.getCreds(request.info.remoteAddress, request.params.role, function(err, res) {
        reply(res)
      })
    }
  }]
