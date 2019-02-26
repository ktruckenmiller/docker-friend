class FrontEndError {
  constructor() {
    this.server = {}
  }

  setServer(server) {
    this.server = server
  }

  publish(payload) {
    this.server.publish('/errors', {msg: payload.message})
  }
}

const frontEndError = new FrontEndError()
exports.throwError = frontEndError.publish

exports.plugin = {
  name: 'errorSockets',
  register: async (server, options) => {
    // await server.publish('/errors', {msg: options.payload.message})
    await server.subscription('/errors')
    frontEndError.setServer(server)
    server.route({
        method: 'GET',
        path: '/boston',
        handler: function (request, h) {

            return 'hello, world';
        }
    });
  }
}




// 'use strict';
//
// let Server
//
// module.exports.throwError = (payload) => {
//   // console.log(payload.message)
//   Server.publish('/errors', {msg: payload.message})
// }
//
//
// module.exports.register = (server, options, next) => {
//   Server = server
//   Server.subscription('/errors')
//   next();
// }
//
//
// module.exports.register.attributes = {
//   name: 'errorSockets',
//   version: '1.0.0'
// };
