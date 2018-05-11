'use strict';

let Server

module.exports.update = (payload) => {
  Server.publish('/aws', payload)
}


module.exports.register = (server, options, next) => {
  Server = server
  Server.subscription('/aws')
  next();
}


module.exports.register.attributes = {
  name: 'awsRoleUpdater',
  version: '1.0.0'
};
