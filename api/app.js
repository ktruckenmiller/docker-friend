const Hapi = require('hapi');
const Inert = require('inert');
const Path = require('path');
const Nes = require('nes');
const Got = require('got');

import AWSRoles from './awsRoles';
import ErrorSockets from './errorSockets';
const awsCreds = require('./awsCredentials').awsCreds;
const _ = require('lodash');


const Routes = require('./routes/index');


const server = new Hapi.Server({
    routes: {
        cors: true,
        files: {
            relativeTo: Path.join(__dirname, '../dist')
        }
    },
    port: 3000,
    router: {
      stripTrailingSlash: true
    }
});

const provision = async () => {


    await server.register([Inert, Nes, AWSRoles, ErrorSockets])

    server.route(Routes)

    await server.start();

    console.log('Server running at:', server.info.uri);
}

provision()


// awsCreds.init()
// server.route(Routes)
// server.subscription('/containers')
// server.subscription('/images')
// server.subscription('/container/{id}');
//
// server.start((err) => {
//   // const currentContainers = () => {
//   //   let allContainers
//   //   return {
//   //     updateContainers: (containers) => {
//   //       console.log(allContainers)
//   //       allContainers = _.map(containers, container => {
//   //         return {
//   //           id: container.Id,
//   //           stream: Got.stream(`http://unix:/var/run/docker.sock:/containers/${container.Id}/stats`).on('data', (data) => {
//   //             console.log(data.toString("utf-8"))
//   //           })
//   //         }
//   //       })
//   //     }
//   //   }
//   // }
//   function refreshDocker() {
//     let containers
//     // let containerStreams = currentContainers()
//     Got('http://unix:/var/run/docker.sock:/containers/json?all=1').then(containers => {
//       containers = awsCreds.filterContainers(containers.body)
//       server.publish('/containers', containers)
//       // containerStreams.updateContainers(containers)
//     })
//     Got('http://unix:/var/run/docker.sock:/images/json?all=1').then(images => {
//       server.publish('/images', images.body)
//     })
//   }
//    // On our event, lets debounce and the load
//   Got.stream('http://unix:/var/run/docker.sock:/events').on('data', _.debounce(refreshDocker, 100))
//
//   if (err) {
//       throw err;
//   }
//   console.log('Server running at:', server.info.uri);
// });
// server.ext({
//     type: 'onRequest',
//     method: function (request, reply) {
//         // check and make sure this is a local request?
//         // console.log(request.route.settings.cors)
//         // console.log(request.path)
//         reply.continue();
//     }
// });
