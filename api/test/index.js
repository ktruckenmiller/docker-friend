import assert from 'assert';


import { AWSCreds } from '../AWSCredentials.js';
let aws
describe('AWS Credential has default creds', () => {

  before(async () => {
    aws = new AWSCreds()
    await aws.init()
  })
  it('should load creds without error', async () => {
    assert(aws.baseProfileSet())
  })
  it('should get roles', async () => {
    assert((await aws.getRoles()).length > 0)
  })

  it('should get mfa device', async () => {
    assert.equal((await aws.getMFADevice()).indexOf('arn:aws:iam::'), 0)
  })

  it('should update roles into the db', async () => {
    assert.ok(await aws.setRoles([{RoleName: 'albertson', boston: 'shoey'}]))
    assert.ok(await aws.setRoles([{RoleName: 'lazy', boston: 'shoey'}]))
    let testRole = await aws.getRole('lazy')
    assert.equal(testRole.profile, 'default')
    assert.equal(testRole.RoleName, 'lazy')
  })

  it('should not authenticate the token', async () => {
    assert.ok((await aws.getSessionToken(652922)).err)
    assert.ok((await aws.getSessionToken()).err)
    // test a good token
    // console.log(await aws.setMFA(519598));
  })

  it('should set the base profile', async () => {
    // assert.ok(await aws.setBaseProfile('default'))
    // this is another profile that's not the default
    assert.ok(await aws.setBaseProfile('fetchit'))
    // throws err because it doesnt exist
    // assert.ok((await aws.setBaseProfile('boston')).err)
  })

  it('should return all available profiles', (done) => {
    assert.equal(aws.getProfileNames().length, 2)
    done()
  })


});


describe('AWS Credential helper no default creds', () => {
  before(() => {
    aws = new AWSCreds('boston')
  })
  it('wont find credentials', done => {
    assert(aws.baseProfileSet() === false)
    done()
  });
  it('should get  0 roles', async () => {
    // console.log()
    assert.equal(await aws.getRoles().length, 0)
  })
  // it('should NOT get mfa device', async () => {
  //   assert.equal((await aws.getMFADevice()).indexOf('arn:aws:iam::'), -1)
  // })
});
