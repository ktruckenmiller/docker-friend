
const awsCreds = require('../awsCredentials')
const Got = require('got')

const Docker = require('dockerode')
var docker = new Docker();

module.exports = [{
        method: 'GET',
        path: '/{param*}',
        handler: {
          directory: {
            path: '.',
            redirectToSlash: true,
            index: true
        }
      }
    },{
      method: 'GET',
      path: '/containers',
      handler: function (err, reply) {
        Got('http://unix:/var/run/docker.sock:/containers/json?all=1').then(containers => {
          reply(containers.body)
        })
      }
    },{
      method: 'GET',
      path: '/images',
      handler: function (err, reply) {
        Got('http://unix:/var/run/docker.sock:/images/json?all=1').then(images => {
          reply(images.body)
        })
      }
    },{
      method: 'GET',
      path: '/local',
      handler: function (request, reply) {
        console.log(request.info);
        reply(request.info)
      }
    },{
      method: 'GET',
      path: '/profiles',
      handler: function(err, reply) {
        reply(awsCreds.getProfileNames())
      }
    }
];
