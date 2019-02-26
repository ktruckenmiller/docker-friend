'use strict'
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');
const expect = Code.expect;
const before = lab.before;
let aws
lab.experiment('awscredentials', () => {

  before(async () => {
    // aws = new awsCreds()
    aws = require('../awsCredentials').awsCreds
  })
  lab.test('get mfa device', async () => {
    aws.baseProfileSet = () => {
      return false
    }
    try {
      aws.getMFADevice()
    }catch(e) {
      expect(e).to.be.an.error('You do not have a base profile selected.')
    }
    // find a profile
    aws._userObj = {
      currentProfile: 'default'
    }
    aws.baseProfileSet = () => {
      return true
    }
    expect(await aws.getMFADevice()).to.be.a.string().and.contain(['arn:aws:iam::'])

    // found a profile, but no mfa in the profile
    aws._userObj = {
      currentProfile: 'danielle'
    }
    try {
      let boston = await aws.getMFADevice()
    } catch(e) {
      expect(e).to.be.an.error("No mfa device detected with the 'danielle' AWS profile, or that profile doesn't have the permission to list MFA devices.")
    }



    // expect(aws.baseProfileSet()).to.equal(true)
    // expect((await aws.getRoles()).length).to.be.above(0)
    // expect(await aws.getMFADevice()).to.be.a.string().and.contain(['arn:aws:iam::'])
    // expect(aws.getProfileNames().length).to.equal(2)

  });

  lab.test('role stuff', async () => {
    aws.findOne = (action, roleObj) => {
      return {profile: '', Arn: '', RoleId: ''}
    }
    expect(await aws.getRole('Boston')).to.include(['profile', 'Arn', 'RoleId'])

    // null
    aws.findOne = (action, roleObj) => {
      return null
    }
    expect(await aws.getRole('boston')).to.be.null()
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

  lab.test('container role request', async () => {
    let roleId
    aws.findOne = () => {
      return
    }
    aws.update = () => {
      return
    }
    aws._sts = {
      assumeRole: (stuff) => {
        return {
          promise: () => {
            return {}
          }
        }
      }
    }


    // no arn
    roleId = await aws.assumeContainerRole({}, true)
    expect(roleId).to.be.undefined()


  })

})

lab.experiment('aws credentials', () => {
  lab.test('get available profiles', async () => {
    let profiles
    try {
      profiles = await aws.checkAWSProfiles()

    }catch (e) {
      expect(e).to.be.an.error("No profile with this name: undefined")
    }

    try {
      profiles = await aws.checkAWSProfiles('boston')

    }catch(e) {
      expect(e).to.be.an.error('No profile with this name: boston')
    }

    profiles = await aws.checkAWSProfiles('default')
  })
  lab.test('init', async () => {
    aws.checkAWSProfiles = () => {
      return {shoey: 'hey'}
    }
    aws.setBaseProfile = () => {return}
    try {
      await aws.init('boston')
    }catch(err) {
      expect(err).to.be.an.error("No profile with this name: boston")
    }
    await aws.init('shoey')
    expect(aws._availableProfiles).to.be.an.object().and.contain('shoey')

  });

  lab.test('Found stashed credentials that still work', async () => {
    let testDate = new Date()
    testDate.setDate(testDate.getDate() + 3)
    let profObj = {
      profileName: 'default',
      AccessKeyId: 'asdf',
      SecretAccessKey: 'asdf',
      SessionToken: 'asdf',
      Expiration: testDate,
      SerialNumber: 'arn:aws:iam::1234:mfa/asdf',
      TokenCode: '423079',
      currentProfile: true,
      _id: 'NF0GEypCyKRX1HL6'
    }
    aws.findOne = (str, obj) => {
      return profObj
    }
    aws.setBaseProfile = () => {
      return
    }
    await aws.init()

  })

  // lab.test('Found stashed creds that are expired', () => {
  //
  // })
})
