const Hapi = require('hapi');
const Inert = require('inert');
const Path = require('path');
const Nes = require('nes')
const Got = require('got')
const _ = require('lodash')

import { AWSCreds } from './awsCredentials'
const awsCreds = new AWSCreds()
awsCreds.init()

const Routes = require('./routes/index')


const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, '../dist')
            }
        }
    }
});
server.connection({
  port: 3000,
  routes: { cors: true }
});



server.register([Inert, Nes], function (err) {
    if (err) {
        throw err;
    }
    server.route(Routes)
    server.subscription('/containers')
    server.subscription('/images')
    server.start((err) => {
      function refreshDocker() {
        Got('http://unix:/var/run/docker.sock:/containers/json?all=1').then(containers => {
          // awsCreds.filterContainers(containers.body).then(res => {
          //   server.publish('/containers', res)
          // }).catch(err)
        })
        Got('http://unix:/var/run/docker.sock:/images/json?all=1').then(images => {

          server.publish('/images', images.body)
        })
      }
      // On our event, lets debounce and the load
      Got.stream('http://unix:/var/run/docker.sock:/events').on('data', _.debounce(refreshDocker, 100))

      if (err) {
          throw err;
      }
      console.log('Server running at:', server.info.uri);
    });
});
server.ext({
    type: 'onRequest',
    method: function (request, reply) {
        // check and make sure this is a local request?
        // console.log(request.raw.req.headers)
        reply.continue();
    }
});
