const request = require('request')
const Docker = require('dockerode')
const docker = new Docker();
module.exports = [{
  method: 'POST',
  path: '/image/remove',
  handler: function(request, reply) {
    console.log('image remove!')
    try {
      const image = docker.getImage(request.payload.image)
      image.remove(image.name)
      // docker.removeImage(image.name)
      reply(image)
    } catch (e) {
      console.log(e)
      reply(e)
    }


    // container.remove(function(err, res) {
    //   if(err) {
    //     console.log(err.json)
    //     reply(err.json)
    //   }else {
    //     reply(res)
    //   }
    // })
  }
}]
