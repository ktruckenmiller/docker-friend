'use strict';


const register = (server, options, next) => {
  console.log('loaded aws roles')
  server.subscription('/aws')
  setInterval(() => {
    server.publish('/aws', "boston")
  } , 3000)
  next();
}


register.attributes = {
  name: 'myPlugin',
  version: '1.0.0'
};

export default register
