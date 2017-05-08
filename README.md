# Docker Friend
A simple way to visualize docker containers, and to assume AWS credentials
for specific containers.

Simply run:
```
docker-compose up
```
and then navigate your browser to:
```
http://localhost:8010/
```

and proceed to be a friend

![alt tag](https://raw.githubusercontent.com/ktruckenmiller/docker-friend/master/docker-friend.png)

### Assume a base profile
In order to use docker-friend, you'll need to assume a base profile. You can
find the base profile in the upper right hand corner of the UI. Once you've
selected the base profile, your containers can then assume specific roles that
you attribute to them.

#### Container-specific roles

To specify the role of a container, simply launch it with the `IAM_ROLE`
environment variable set to the IAM role you wish the container to run with.

```shell
docker run -e IAM_ROLE=my-role ubuntu:14.04
```

# Using different docker bridge networks

If you areusing docker to create multiple bridged networks, you'll have to add opts to the docker container.
Using docker compose, you can specify your network thus:

```
version: '3'
networks:
  my-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: my-network
    ipam:
      driver: default
      config:
      - subnet: 10.100.0.0/16

```
As you can see, you need to specify driver_opts. That just sets up the network
interface to have a specific name. You'll need to restart docker-friend after
you create this network.
