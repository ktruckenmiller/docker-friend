/**
  This will do an ifconfig and it will get the network interfaces that are avail

  I should just put this on a cron so I don't have to worry about it anymore

**/

let promise = require('ifconfig-linux')(); // this return a promise
const _ = require('lodash');
promise.then((stuff) => {
  let interfaces = _.chain(stuff).filter((val, key) => {
    return key.indexOf('br-') > -1 || key.indexOf('docker0') > -1
  }).map((val, key) => {
    return val.device
  }).value()
  _.map(interfaces, (val, key) => {console.log(val)})
});
