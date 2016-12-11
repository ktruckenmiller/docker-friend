'use strict';
var _ = require('lodash')


$(document).ready(function() {
  $('#assumerole .form .button').on("click", processForm);



  if($('.navbar')[0]) {


    updateContainers()

    Vue.component('container-modal', {
      props: ['container', 'editing', 'cancelModal', 'current'],
      template: `
        <div v-if="editing === 'container'" class="modal edit-container">
          <h3>{{current.container.Name}}</h3>
          <button v-on:click="save" class="button">save</button>
          <button v-on:click="cancel" class="button cancel">cancel</button>
        </div>
      `,
      methods: {
        cancel: function() {
          this.cancelModal()
        },
        save: function() {
        }
      }
    })
    Vue.component('aws-modal', {
      props: ['aws', 'editing', 'cancelModal', 'openModal', 'roles', 'rolePrefix', 'current', 'currentProfile'],
      data: function() {
        return {
          roleName: "",
          mfa: ""
        }
      },
      template: `
        <div v-if="editing === 'aws'" class="modal edit-aws">
          <div class="head">
            <div class="text">
              <input type="text" v-model="roleName" placeholder="IAM Role Name" />
              <input type="text" v-model="mfa" placeholder="MFA Token" />
            </div>
            <div class="controls">
              <button v-on:click="cancel" class="button cancel">cancel</button>
            </div>
          </div>
          <div class="mid">
            <ul class="roles">
              <li v-on:click="load(role, index)" v-for="(role, index) in computed_roles"><i class="fa fa-caret-right"></i>{{role}}</li>
            </ul>
          </div>

        </div>
      `,
      methods: {
        cancel: function() {
          this.cancelModal()
        },
        load: function(role, index) {
          // call the api with this, when done close the window
          var that = this;
          $.ajax({
            method: "POST",
            url: '/assume',
            data: {
              id: this.current.container.Id,
              role: this.rolePrefix + role,
              mfa: this.mfa
            }
          }).done(function(err,res, body) {

            if(body.status === 200) {
              if(body.responseJSON.err) {
                if(body.responseJSON.res.includes("not authorized")) {
                  alert("You're not authorized to assume this role.")
                }else {
                  alert(body.responseJSON.res)
                }

              }else {
                that.cancelModal()
              }
            }else {
              alert("Somethings wrong, either this container doesn't exist, or something else is afoot.")
            }
          })
        }
      },
      computed: {
        computed_roles: function() {
          var rolename = this.roleName.toLowerCase();
          if (rolename.length > 0) {
            return _.filter(this.roles, function(str) {
              return str.toLowerCase().indexOf(rolename) !== -1
            })
          } else {
            return []
          }
        },
        mfa_text: function() {
          return this.currentProfile + " MFA Token"
        }
      }

    })
    Vue.component('my-container', {
      props: ['container', 'openModal'],
      template: `
      <div class="docker_container box-row">
        <span :class="[container.State.Status, 'state']"></span>
        <div class="names">
          <h3>{{container.Name}}</h3>
          <p :class="container.ImagePrefix">{{container.Config.Image}}</p>
        </div>

        <div class="controls">
          <i class="fa fa-key" v-if="container.State.Status === 'running'" v-on:click="openModal('aws', container)" title="Load AWS Credentials"></i>
          <i class="fa fa-stop" v-on:click="stop" v-if="container.State.Status === 'running'" title="Stop Container"></i>
          <i class="fa fa-play" v-on:click="start" v-if="container.State.Status !== 'running'" title="Start Container"></i>
          <i class="fa fa-refresh" aria-hidden="true" v-on:click="restart" title="Restart Container"></i>
          <i class="fa fa-times" v-on:click="kill_container" aria-hidden="true" title="Remove Container"></i>
          <i class="fa fa-ellipsis-h" v-on:click="openModal('container', 'containerobj?')" aria-hidden="true"></i>
        </div>
      </div>`,
      data: function() {
        return {
          isDim: false
        }
      },
      watch: {
        state: function(newVal, oldVal) {
          // console.log(newVal);
        }
      },
      computed: {
        ha_container: function() {
          return this.container.Name === 'docker-friend' || this.container.Name === 'docker-events'
        }
      },
      methods: {
        kill_container: function() {
          dockerRun({
            command: 'kill',
            child: this
          })
        },
        load_creds: function() {
          dockerRun({
            command: 'load_creds',
            child: this

          })
        },
        restart: function() {
          dockerRun({
            command: 'restart',
            child: this
          })
        },
        stop: function() {
          dockerRun({
            command: 'stop',
            child: this
          })
        },
        start: function() {
          dockerRun({
            command: 'start', child: this
          })
        }
      }
    });
    Vue.component('my-image', {
      props: ['image'],
      computed: {
        imageName: function() {
          if(this.image.RepoTags[0]) {
            return this.image.RepoTags[0]
          }else {
            return this.image.RepoDigests[0]
          }
        },
        size: function() {
          return formatBytes(this.image.Size)
        }
      },
      template: `
        <div class="docker_image box-row">
          <span class="has_tag"></span>
          <div class="names">
            <h2>{{imageName}}</h2>
            <p>{{size}}</p>
          </div>
          <div class="controls">

          </div>
        </div>
      `
    })
    Vue.component('my-subnav', {
      props: ['currentPage', 'subpage', 'changeSubpage'],
      computed: {
        isContainer: function() { return this.subpage === 'containers' },
        isImage: function() { return this.subpage === 'images' }
      },
      template: `
      <div class="subnav">
        <ul v-if="currentPage === '/local'" class="local">
          <li v-on:click="changeSubpage" v-bind:class="{active: isContainer}"><i class="fa fa-braille" aria-hidden="true"></i>containers</li>
          <li v-on:click="changeSubpage" v-bind:class="{active: isImage}"><i class="fa fa-codepen" aria-hidden="true"></i>images</li>
        </ul>
        <ul v-if="currentPage === '/cloud'" class="cloud">
          <li class="build">build</li>
          <li class="deploy">deployed</li>
        </ul>
      </div>
      `
    })
    var local = new Vue({
      el: '#main',
      data: {
        images: [],
        containers: [],
        cleaned_containers: [],
        cleaned_images: [],
        editing: '',
        current: {
          container: {},
          aws: {},
          subpage: "containers"
        },
        roles: [],
        role_prefix: ""
      },
      computed: {
        cleaned_containers: function() {
          return this.containers.map(function(container) {
              container.Name = container.Name.replace("/", "")
              return container
          })
        },
        cleaned_images: function () {
          return this.images.map(function(image) {
            return image
          })
        }
      },
      methods: {
        cancelModal: function() {
          this.editing = ''
        },
        openModal: function(type, obj) {

          this.current.container = _.assignIn(this.current.container, obj);
          this.editing = type;
        },
        changeSubpage: function(e) {
            let name = e.currentTarget.innerText;
            if(name) {this.current.subpage = name}
        }
      }
    })
    // Websockets for events
    var Nes = require('nes');
    var client = new Nes.Client('ws://localhost:8080');
    client.connect(function (err, res) {
        client.onUpdate = function (res) {
          local.containers = parseEvents(res)
        };
    });

    function parseEvents(res) {
      var newArr = JSON.parse(res);
      newArr = _.reject(newArr, function(cont) {
        return cont.Names[0] === '/docker-friend' || cont.Names[0] === '/docker-events'
      })
      return newArr.map(function(cont) {
        var oldCont = _.find(local.containers, function(c) {
          return c.Id === cont.Id
        })
        return _.assignIn(oldCont, {
          Name: cont.Names[0],
          State: {
            Status: cont.State
          },
          Id: cont.Id,
          Config: {
            Image: cont.Image
          }
        })
      })
    }
  }
  function updateContainers() {
    $.ajax({
      url: '/containers'
    }).done(function(res) {
      local.containers = _.reject(res, function(cont) {
        return cont.Name === '/docker-friend' || cont.Name === '/docker-events' || cont.Name == '/docker-friend-redis'
      })
    })
    $.ajax({
      url: '/images'
    }).done(function(res) {
      console.log(res);
      local.images = res
    })
    $.ajax({
      url: '/roles'
    }).done(function(res) {
      local.roles = _.map(res, function(role) {
        return role.split(':role/')[1]
      });
      local.rolePrefix = res[0].split(':role/')[0] + ':role/'

    })
  }

})
function dockerRun(obj) {
  console.log(obj);
  $.ajax({
    url: '/containers',
    method: 'POST',
    data: {
      command: obj.command,
      id: obj.child.container.Id
    }
  }).done(function(res) {
    console.log(res)
  })
}

function formatBytes(bytes) {
   if(bytes == 0) return '0 Byte';
   var k = 1000;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function processForm(e) {
  var profile_mfa = $('#assumerole .form .mfa')[0].value;
  var profile = e.target.value;


  $('#logging_in').addClass('opening');
  $.ajax({
    url: '/profile',
    method: 'POST',
    data: {
      profile_mfa: profile_mfa,
      profile: profile
    }
  }).done(function(res) {
    if(!res.err) {
      window.location = '/local'
    }
  })

  return false;
}
