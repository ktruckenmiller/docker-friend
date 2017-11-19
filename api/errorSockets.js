'use strict';

let Server

module.exports.throwError = (payload) => {
  // console.log(payload.message)
  Server.publish('/errors', {msg: payload.message})
}


module.exports.register = (server, options, next) => {
  Server = server
  Server.subscription('/errors')
  next();
}


module.exports.register.attributes = {
  name: 'errorSockets',
  version: '1.0.0'
};
