const request = require('request')
const Docker = require('dockerode')
const docker = new Docker();
module.exports = [{
    method: 'POST',
    path: '/container/remove',
    handler: function(request, reply) {
      const container = docker.getContainer(request.payload.container.replace('/', ''))
      container.remove(function(err, res) {
        if(err) {
          console.log(err.json)
          reply(err.json)
        }else {
          reply(res)
        }
      })
    }
  },{
    method: 'POST',
    path: '/container/start',
    handler: function(request, reply) {
      const container = docker.getContainer(request.payload.container.replace('/', ''))
      container.start(function(err, res) {
        if(err) {
          reply(err)
        }else {
          reply(res)
        }
      })
    }
  },{
    method: 'POST',
    path: '/container/restart',
    handler: function(request, reply) {
      const container = docker.getContainer(request.payload.container.replace('/', ''))
      container.restart(function(err, res) {
        if(err) {
          reply(err)
        }else {
          reply(res)
        }
      })
    }
},{
  method: 'POST',
  path: '/container/stop',
  handler: function(request, reply) {
    const container = docker.getContainer(request.payload.container.replace('/', ''))
    container.stop(function(err, res) {
      console.log(err,res)
      if(err) {
        reply(err)
      }else {
        reply(res)
      }
    })
  }
}]
