const Datastore = require('nedb')
const mainDb = new Datastore({ filename: 'tmp/data.db', autoload: true });
const containers = new Datastore({ filename: 'tmp/containers.db', autoload: true });
const roles = new Datastore({ filename: 'tmp/roles.db', autoload: true });
const profile = new Datastore({ filename: 'tmp/profile.db', autoload: true });

const db = {
  containers: containers,
  roles: roles,
  profile: profile
}


const findOne = (dbName, query) => {
  return new Promise((resolve, reject) => {
    db[dbName].findOne(query, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

const update = (dbName, query, set, upsert) => {
  return new Promise((resolve, reject) => {
    db[dbName].update(query, set, upsert, (err, res) => {
      if (err) {reject(err)}
      else {resolve(res)}
    })
  })

}
// db.roles.update({RoleName: role.RoleName}, {$set: newRole}, {upsert: true}, function(err, res) {})

export { findOne, update }
