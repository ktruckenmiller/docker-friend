exports.plugin = {
  name: 'awsRoleUpdater',
  register: async (server, options) => {
    await server.subscription('/aws')
    const sum = function (array) {

        let total = 0;

        array.forEach((item) => {

            total += item;
        });

        return total;
    };

    server.method('sum', sum, {
        generateKey: (array) => array.join(',')
    });
  }
}


exports.update = (payload) => {
  console.log(payload)
  // Server.publish('/aws', payload)
}
//
//
// exports.register = (server, options, next) => {
//   Server = server
//   Server.subscription('/aws')
//   next();
// }
//
//
// exports.register.attributes = {
//   name: 'awsRoleUpdater',
//   version: '1.0.0'
// };
