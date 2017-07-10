import assert from 'assert';

import { update, findOne } from '../database.js'
import { AWSCreds } from '../AWSCredentials.js';
let aws
describe('Docker container call tests', () => {

  before(() => {
    aws = new AWSCreds()
  })
  it('should list container by ip', async () => {
    let container = await aws.getContainerByIp('172.17.0.2')
    assert(container)
  })

  it('should find the IAM_ROLE', (done) => {
    let container = {
      Config: {
        Env: [
          'IAM_ROLE=boston'
        ]
      }
    }
    assert.equal(aws.getContainerRole(container), 'boston')
    container.Config.Env = []
    assert.equal(aws.getContainerRole(container), undefined)
    done()
  })

  it('should find the container role arn', async () => {
    // might have to run some docker commands here to set it up
    assert.equal(await aws.getContainerRoleNameByIp('172.17.0.2'), 'test')
  })

  it('container should find cached creds', async () => {
    // aws.setBaseProfile('fetchit')
    let testObj = {
      RoleName: 'asdf',
      profile: 'default',
      TempCreds: {
        Expiration: new Date('2017-12-12'),
        AccessKeyId: 'boston',
        SecretAccessKey: 'asdf',
        Token: 'boston'
      }
    }
    //
    await update('roles', {RoleName: 'asdf'}, {$set: testObj}, {upsert: true})
    aws.assumeContainerRole = () => {
      return new Promise((resolve, reject) => {
        if ( null ) {reject()}
        resolve()
      })
    }
    assert.ok(await aws.containerRoleRequest('asdf'))

    // refresh creds
    testObj.TempCreds.Expiration = new Date('2015-03-25')
    await update('roles', {RoleName: 'asdf'}, {$set: testObj}, {upsert: true})
    assert.ok(await aws.containerRoleRequest('asdf'))

    // no creds
    testObj = {
      RoleName: 'asdf',
      profile: 'default',
    }
    await update('roles', {RoleName: 'asdf'}, {$set: testObj}, {upsert: true})
    assert.ok(await aws.containerRoleRequest('asdf'))
  })

})
