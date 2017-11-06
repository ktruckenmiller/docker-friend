import AWS from 'aws-sdk'
import {
  concat,
  map,
  chunk,
  flatten,
  chain,
  merge,
  find,
  isEmpty
} from 'lodash'
class ECS {
  constructor() {

  }
  getInstances(clusterName) {
    console.log("get container instances")
    return new Promise((resolve, reject) => {
      let ecs = new AWS.ECS({region: 'us-east-1'})
      let containerInstances = []
      ecs.listContainerInstances({
          cluster: clusterName
      }).eachPage((err, data, done) => {
        if (err) {
          reject(err)
        }
        if (data) {
          containerInstances = concat(containerInstances, data.containerInstanceArns)
          done(true)
        } else {

          resolve(containerInstances)
          done()
        }
      })
    })
  }
  async getServiceInfo(services, clusterName) {
    if (isEmpty(services)) {return []}
    let ecs = new AWS.ECS({region: 'us-east-1'})
    let reqServices = chunk(services, 10)
    let responses = map(reqServices, (srvs) => {
      return new Promise((resolve, reject) => {
        ecs.describeServices({
          cluster: clusterName,
          services: srvs
        }, (err, res) => {
          if (err) {reject(err)}
          resolve(res)
        })
      })
    })

    let boston =  chain(await Promise.all(responses))
      .map((val)=> {
        return val.services
      })
      .flatten()
      .value()
      return boston
  }
  getServices(clusterName) {
    console.log("get services " + clusterName)
    return new Promise((resolve, reject) => {
      let ecs = new AWS.ECS({region: 'us-east-1'})
      let services = []
      ecs.listServices({cluster: clusterName}).eachPage((err, data, done) => {
        if (err) {
          reject(err)
        }
        if (data) {
          services = concat(services, data.serviceArns)
          done(true)
        } else {

          resolve(services)
          done()
        }
      })
    })
  }
  async getInstanceInfo(instances, clusterName) {
    if (isEmpty(instances)) {return []}
    let ecs = new AWS.ECS({region: 'us-east-1'})
    let ec2 = new AWS.EC2({region: 'us-east-1'})
    let reqInstances = chunk(instances, 10)
    let responses = map(reqInstances, (instances) => {
      return new Promise((resolve, reject) => {
        ecs.describeContainerInstances({
          cluster: clusterName,
          containerInstances: instances
        }, (err, res) => {
          if (err) {reject(err)}
          resolve(res)
        })
      })
    })

    instances = chain(await Promise.all(responses))
      .map((val)=> {
        return val.containerInstances
      })
      .flatten()
      .value()

    let ec2Data = new Promise((resolve, reject) => {
        ec2.describeInstances({
          InstanceIds: map(instances, (inst) => inst.InstanceId)
        }, (err, data) => {
          if (err) {reject(err)}
          resolve(data.Reservations)
        })
      })
    ec2Data = await ec2Data
    ec2Data = chain(ec2Data)
      .map((val) => {
        return val.Instances[0]
      })
      .map((val) => {

        let matcher = find(instances, (v) => {
          return val.InstanceId === v.ec2InstanceId
        })
        return merge(matcher, val)
      })
      .value()
    return ec2Data
  }
  async clusterDetails(clusterName) {
    try {
      let services = await this.getServices(clusterName)
      let instances = await this.getInstances(clusterName)
      let serviceInfo = await this.getServiceInfo(services, clusterName)
      let instanceInfo = await this.getInstanceInfo(instances, clusterName)
      return {
        clusterName: clusterName,
        services: serviceInfo,
        instances: instanceInfo
      }
    }catch(e) {
      console.log(e)
      return e
    }

  }
}

export {ECS}
