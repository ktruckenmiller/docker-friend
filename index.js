var Hapi = require('hapi');
var Nes = require('nes');
var got = require('got');
var _ = require('lodash');

var server = new Hapi.Server();
server.connection({ port: 8080 });

server.register(Nes, function (err) {

    server.start(function (err) {
      got('http://unix:/var/run/docker.sock:/containers/json?all=1').then(res => {
        server.broadcast(res.body);
      })
      function pushContainers() {
        got('http://unix:/var/run/docker.sock:/containers/json?all=1').then(res => {
          server.broadcast(res.body);
        })
      }
      got.stream('http://unix:/var/run/docker.sock:/events').on('data', _.debounce(pushContainers, 100));
    });
});
