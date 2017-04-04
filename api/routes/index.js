const root = require('./root');
const containers = require('./containers')
const images = require('./images')
const aws = require('./aws')
module.exports = [].concat(root, containers, aws, images);
