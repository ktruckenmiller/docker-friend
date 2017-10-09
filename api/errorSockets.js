'use strict';

let Server

module.exports.throwError = (payload) => {
  Server.publish('/errors', payload)
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
