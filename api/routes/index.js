const root = require('./root');
const containers = require('./containers')
const aws = require('./aws')
module.exports = [].concat(root, containers, aws);
