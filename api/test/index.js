'use strict'
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');
const expect = Code.expect;
const awsCreds = require('../awsCredentials').AWSCreds
console.log(awsCreds)

const before = lab.before;
let aws
lab.experiment('awscredentials', () => {

  before(async () => {
    aws = new awsCreds()
    await aws.init()
  })
  lab.test('init aws creds', async () => {
    expect(aws.baseProfileSet()).to.equal(true)
    expect((await aws.getRoles()).length).to.be.above(0)
    expect(await aws.getMFADevice()).to.be.a.string().and.contain(['arn:aws:iam::'])
    expect(aws.getProfileNames().length).to.equal(2)

  });
  lab.test('role stuff', async () => {
    try {
      await aws.getRole('boston')
    }catch(err) {
      expect(err).to.be.an.error("Could not find the profile boston.")
    }
    expect(await aws.getRole('Boston')).to.include(['profile', 'Arn', 'RoleId'])
  })
  lab.test('session token', async () => {
    aws.getMFADevice = () => {
      return new Promise((resolve, reject) => {
        resolve('arn:thing');
        if(null) {
          reject()
        }
      })
    }
    try {
      await aws.getSessionToken(12345)
    }catch(err) {
      expect(err).to.be.an.error("1 validation error detected: Value '12345' at 'tokenCode' failed to satisfy constraint: Member must have length greater than or equal to 6")
    }

    try {
      expect(await aws.getSessionToken()).to.be.an.object()
    } catch(err) {
      console.log(err)
    }

  })
  lab.test('profile session token expired', () => {
    // creds have expired
    let date = new Date()
    date.setDate(date.getDate() - 4)
    date = date.toISOString().substring(0,19)+'Z'
    expect(aws.credsExpired(date))

    let notExpiredDate = new Date()
    notExpiredDate.setDate(notExpiredDate.getDate() + 4)
    notExpiredDate = notExpiredDate.toISOString().substring(0,19)+'Z'
    expect(aws.credsExpired(notExpiredDate)).to.be.false()
  })


})
lab.experiment('no-aws credentials', () => {
  lab.test('AWS Credential helper no default creds', () => {
    try {
      new awsCreds('boston')
    }catch(err) {
      expect(err).to.be.an.error("This profile doesn't exist.")
    }
  });
})
