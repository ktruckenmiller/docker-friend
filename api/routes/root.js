
const awsCreds = require('../awsCredentials').awsCreds
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
          reply(awsCreds.filterContainers(containers.body))
        })
      }
    },{
      method: 'GET',
      path: '/container/stats/{params*}',
      handler: function (req, reply) {
        Got(`http://unix:/var/run/docker.sock:/containers/${req.params.params}/stats?stream=false`).then(stats => {
          reply(JSON.parse(stats.body))
        }).catch(err => {
          reply({err: true, msg: 'Couldnt find cake'})
        })
      }
    },{
      method: 'GET',
      path: '/images',
      handler: function (err, reply) {
        Got('http://unix:/var/run/docker.sock:/images/json?all=1').then(images => {
          reply(images.body)
        }).catch(err => {
          reply(err)
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
        console.log(awsCreds)
        reply(awsCreds.getProfileNames())
      }
    }
];
