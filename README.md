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

![alt tag](static/docker-friend.png)

### Assume a base profile
In order to use docker-friend, you'll need to assume a base profile. You can
find the base profile in the upper right hand corner of the UI. Once you've
selected the base profile, your containers can then assume specific roles that
you attribute to them.

#### Container-specific roles

To specify the role of a container, simply launch it with the `IAM_ROLE`
environment variable set to the IAM role you wish the container to run with.

```shell
docker run -e IAM_ROLE=arn:aws:iam::<myaccount>:role/myrole ubuntu:14.04
```

# Using different docker bridge networks

If you are using docker-compose, you'll need to specify your network so that docker friend doesn't have any trouble figuring out the plumbing. Right now you'll have to restart docker friend when you spin up a new compose stack, but I'm working on just plumbing that on the fly.

```
version: '3'
networks:
  mynetwork:
    ipam:
      config:
        - subnet: 192.168.120.0/21

```
