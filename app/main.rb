require 'sinatra'
# require 'sinatra/base'
require 'aws-sdk'
require 'sinatra/reloader' if development?
require 'tilt/erubis'
require 'json'
require 'shellwords'
require 'open3'
require 'docker'
require 'inifile'

require 'zlib'
require 'date'

require 'sinatra/base'
require_relative 'helpers'
class DockerFriend < Sinatra::Base
  enable :sessions
  set :root, File.dirname(__FILE__)
  set :bind, '0.0.0.0'
  set :port, 9292

  configure :development do
    register Sinatra::Reloader
    p File.dirname(__FILE__) + '/helpers.rb'
    also_reload File.dirname(__FILE__) + '/helpers.rb'
  end


  # Helpers
  helpers Sinatra::DockerFriend::Helpers

  # # Routes
  # register Sinatra::DockerFriend::Routing::Sessions



  before do
    current_profile_expired?

    if !is_local_req?
      puts 'Request IP: ' + request.ip
      redirect 'http://google.com'
    end
    if session[:profiles].empty?
      get_profile_environments()
    end

  end

  get '/' do
    if session[:elevated]
      redirect '/profile', 303
    else
      erb :main_layout, :layout => false do
        erb :profile, { locals: { profiles: session[:profiles] } }
      end
    end
  end

  post '/profile' do
    if !params[:profile_mfa].nil? && !params[:profile_mfa].empty?
      session[:profile_mfa] = params[:profile_mfa]
    end
    p params.inspect
    session[:current_profile] = params[:profile]
    res = set_creds
    content_type 'text/json'
    JSON.pretty_generate(res)
  end

  get '/profile' do
    if session[:current_profile]

      erb :main_layout, :layout => false do
        erb :index, { locals: { current_profile: session[:current_profile] } }
      end
    else
      redirect '/', 303
    end
  end

  get '/session' do
    content_type 'text/json'
    JSON.pretty_generate(session.inspect)
  end

  get '/roles' do
    content_type 'text/json'
    JSON.pretty_generate(get_roles)
  end

  get '/containers' do
    containers = get_containers
    content_type 'text/json'
    JSON.pretty_generate(containers)
  end
  post '/containers' do
    container = Docker::Container.get(params[:id])

    if params[:command] == "kill"

      container.kill
      res = container.delete(:force => true)
    elsif params[:command] == "load_creds"
      # get container user?
      begin
        user = container.exec(['whoami']).flatten[0].gsub!(/\W+/, '')
      rescue
        user = "root"
      end
      directory = "/#{user}/.aws/credentials"
      # res = container.store_file("/root/.aws/credentials", "Hello world")
      res = "boston"
    elsif params[:command] == "restart"
      res = container.restart
    elsif params[:command] == "stop"
      res = container.stop
    elsif params[:command] == "start"
      res = container.start
    elsif params[:command] == "logs"
      res = container.logs(:stdout)
    end
    content_type 'text/json'
    JSON.pretty_generate(res)
  end
  post '/assume' do
    # get the creds
    creds = authenticate(params[:id], params[:role], params[:mfa])
    # push the creds into the container
    p creds
    if creds[:err]
      content_type 'text/json'
      JSON.pretty_generate({err: true, res: creds[:res].to_s})
    else
      the_creds_file = get_creds_file(params[:id])
      res = put_file_in_container(the_creds_file, params[:id])
      content_type 'text/json'
      JSON.pretty_generate(res)
    end

  end

  get '/restart' do
    erb :restart
  end

  get '/current' do
    begin
      names = iam.list_policies.policies.map { |pol| pol.to_h}
      JSON.pretty_generate(names)
    rescue Aws::IAM::Errors::ServiceError
      # rescues all errors returned by AWS Identity and Access Management
    end
  end

  post '/profile' do

  end

end



#
# class DockerFriend < Sinatra::Base

#   helpers do
#     def has_profile?
#       if session[:current_profile]
#         true
#       else
#         false
#       end
#     end

#     def get_roles(iam)
#       roles = []
#       iam.list_roles.each do |response|
#         roles << response.roles.map(&:arn)
#       end
#       content_type 'text/json'
#       JSON.pretty_generate(roles.flatten)
#     end
#     def get_mfa_device(iam)
#
#       res = iam.list_mfa_devices()
#       res.mfa_devices[0].serial_number
#     end
#     def get_creds()
#       if session[:current_profile]
#         Aws::SharedCredentials.new({profile_name: session[:current_profile], correctClockSkew: true})
#       else
#         redirect '/'
#       end
#     end
#
#   end
#   def initialize
#     super()
#     iam = {}
#   end
#   enable  :sessions, :logging
#   set :dump_errors, false

#   set :sessions, true
#   # use Rack::Session::Cookie, :key => 'rack.session',
#   #                          :domain => 'localhost',
#   #                          :path => '/',
#   #                          :expire_after => 2592000, # In seconds
#   #                          :secret => 'blahblah'
#
#
#
#
#   get '/' do
#     erb :main_layout, :layout => false do
#       erb :profile, { locals: { profiles: get_profile_environments } }
#     end
#   end
#
#   post '/profile' do
#
#     session[:current_profile] = params[:profile]
#     iam = Aws::IAM::Client.new(region: 'us-east-1')
#     Aws.config.update({
#       region: 'us-east-1',
#       credentials: get_creds()
#     })
#     session[:mfa_device] = get_mfa_device(iam)
#     redirect '/profile', 303
#   end
#
#   get '/profile' do
#     if session[:current_profile]
#
#       erb :main_layout, :layout => false do
#         erb :index, { locals: { current_profile: session[:current_profile] } }
#       end
#     else
#       redirect '/', 303
#     end
#   end
#
#   get '/roles' do
#     iam = Aws::IAM::Client.new(region: 'us-east-1')
#     get_roles(iam)
#   end
# end
#
# #get secrets
#
# creds = Aws::SharedCredentials.new({profile_name: "dev", correctClockSkew: true})
#

# roles = []
# mfa_devices =[]
# current_profile = nil
# used_roles = []
# iam = {}
# sts = {}
#
# sts = Aws::STS::Client.new(region: 'us-east-1')
# iam = Aws::IAM::Client.new()
#

#
#
#
# session = {
#   current_role: "",
#   mfa_device: "",
#   credentials: [],
#   current_profile: "",
#   profiles: []
# }
#
#
#
#
# current_role = nil
#
#
# credentials = nil
#
# class PerRequesterRoles
#   attr_accessor :requester_roles
#   def initialize
#     @requester_roles = {}
#   end
#
#   def requester_data request
#     "#{request.ip}:#{request.user_agent}"
#   end
#
#   def log_requester request
#     requester_id = requester_data(request)
#     if @requester_roles.keys().include? requester_id
#       @requester_roles[requester_id][:requests] += 1
#     else
#       @requester_roles[requester_id] = { requests: 1 }
#     end
#     return requester_id
#   end
#
#
#   def dump_json
#     JSON.pretty_generate @requester_roles.to_h
#   end
#
# end
#
# def authenticate(devices, mfa_code, role, container_id)
#   boston = {
#     devices: devices,
#     mfa: mfa_code,
#     role: role,
#     container_id: container_id
#   }
#   # @serial = devices.first
#   # if mfa_code =~ /^[0-9]+$/
#   #   @mfa_str = "--serial-number #{Shellwords.escape @serial} --token-code #{Shellwords.escape mfa_code}"
#   # else
#   #   @mfa_str = ""
#   # end
#   # # if used_roles.include? role
#   # #   used_roles.delete role
#   # # end
#   # # used_roles.unshift role
#   # # $stderr.puts command
#   # if not profile_auth.keys.include? current_profile or profile_auth[current_profile].empty?
#   #   command = "aws --profile #{Shellwords.escape current_profile} --region us-east-1 sts assume-role --role-arn #{Shellwords.escape role} --role-session-name assumed-role #{@mfa_str} --duration-seconds 86400}"
#   #   stdout, stderr, status = Open3.capture3( command )
#   # else
#   #   command = "aws --region us-east-1 sts assume-role --role-arn #{Shellwords.escape role} --role-session-name assumed-role --duration-seconds #{Shellwords.escape 86400}"
#   #   stdout, stderr, status = Open3.capture3(
#   #     {
#   #       "AWS_SESSION_TOKEN"=>profile_auth[current_profile]['SessionToken'],
#   #       "AWS_ACCESS_KEY_ID"=>profile_auth[current_profile]['AccessKeyId'],
#   #       "AWS_SECRET_ACCESS_KEY"=>profile_auth[current_profile]['SecretAccessKey'],
#   #     },
#   #     command
#   #   )
#   # end
#   # result = { stdout: stdout, stderr: stderr, status: status }
#   # if status.exitstatus == 0
#   #   data = JSON.parse(stdout)
#   #   result['data'] = data
#   #   credentials = {
#   #     Code: "Success",
#   #     LastUpdated: Time.new.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
#   #     Type: "AWS-HMAC",
#   #     AccessKeyId: data['Credentials']['AccessKeyId'],
#   #     SecretAccessKey: data['Credentials']['SecretAccessKey'],
#   #     Token: data['Credentials']['SessionToken'],
#   #     Expiration: data['Credentials']['Expiration']
#   #   }
#   #   if params.keys.include? :requester
#   #     requester_roles.requester_roles[container_id][:credentials] = credentials
#   #     puts "Setting credentials for requester #{container_id}"
#   #   else
#   #     puts "params: #{params.inspect}"
#   #   end
#   #   result['credentials'] = credentials
#   #   current_role = role
#   #   credentials
#   # else
#   #   "error"
#   # end
# end
#
#
#
# requester_roles = PerRequesterRoles.new
#
# get %r|/latest/meta-data/iam/security-credentials/?$| do
#  requester_roles.log_requester request
#  if current_profile
#     if current_role
#       current_role
#     end
#   end
# end
#
# #require 'digest/sha1' # crc should be faster!
#
#
# get %r|^/config/current$| do
#     if current_role
#     redirect "/config/#{current_role}", 303
#     else
#     status 404
#     "No role is set"
#     end
# end
#
# get %r|^/config/(.+)/?$| do
#     content_type 'text/plain'
#     erb :config, { locals: { role: params['captures'].first, profile_auth: profile_auth[current_profile] } }
# end
#
# get %r|/latest/meta-data/iam/security-credentials/(.+)| do
#   requester_roles.log_requester request
#   if current_profile
#     if params['captures'].first == current_role
#       data = JSON.pretty_generate credentials
#       content_type 'text/json'
#       etag Zlib::crc32(data).to_s
#       last_modified DateTime.parse( credentials[:LastUpdated] )
#       data
#     else
#       status 404
#     end
#   end
# end
#
#
#
# get '/using-config' do
#   erb :using_config
# end
#
# get '/status' do
#   status 200
#   content_type 'text/json'
#   JSON.pretty_generate :credentials=> credentials
# end
#
#
# get '/' do
#   erb :main_layout, :layout => false do
#     if current_profile == nil
#       erb :profile, { locals: { profiles: get_profile_environments } }
#     else
#       erb :index, { locals: { session: session } }
#
#       # erb :index, { locals: { current_role: current_role, requesters: requester_roles.requester_roles, current_profile: current_profile, mfa_devices: mfa_devices,  :roles => roles, :profile_auth => profile_auth } }
#     end
#   end
# end
#
# get '/identity' do
#   content_type "application/json"
#   iam.get_caller_identity()
# end
#
#
#
#
#
# get '/roles' do
#   roles = []
#
#   iam.list_roles.each do |response|
#     roles << response.roles.map(&:arn)
#   end
#   content_type 'text/json'
#   JSON.pretty_generate(roles.flatten)
# end
#
# get '/containers' do
#   containers = Docker::Container.all(:all => true)
#   containers = containers.map { |c|
#     c.json
#   }
#   content_type 'text/json'
#   JSON.pretty_generate(containers)
# end
#
# post '/containers' do
#   container = Docker::Container.get(params[:id])
#
#   if params[:command] == "kill"
#
#     container.kill
#     res = container.delete(:force => true)
#   elsif params[:command] == "load_creds"
#     # get container user?
#     begin
#       user = container.exec(['whoami']).flatten[0].gsub!(/\W+/, '')
#     rescue
#       user = "root"
#     end
#     directory = "/#{user}/.aws/credentials"
#     # res = container.store_file("/root/.aws/credentials", "Hello world")
#     res = "boston"
#   elsif params[:command] == "restart"
#     res = container.restart
#   elsif params[:command] == "stop"
#     res = container.stop
#   elsif params[:command] == "start"
#     res = container.start
#   elsif params[:command] == "logs"
#     res = container.logs(:stdout)
#   end
#   content_type 'text/json'
#   JSON.pretty_generate(res)
# end
#
# post '/assume' do
#   # get the creds
#
#   creds = authenticate(mfa_devices, params[:id], params[:role], params[:mfa])
#   # push the creds into the container
#   # container.store_file("/root/.aws/credentials", creds)
#   content_type 'text/json'
#   JSON.pretty_generate(creds)
# end
#
# def get_profile_environments
#   profiles = []
#   profile_path = "~/.aws/credentials"
#   begin
#     profile_path = File.expand_path profile_path
#   rescue ArgumentError=>e # docker container maybe?
#     profile_path = "/code/.aws/credentials"
#     ENV['HOME'] = '/code'
#   end
#
#
#   aws_config = IniFile.load( profile_path )
#   aws_config.each_section do |section|
#     required_fields = %w[ aws_access_key_id aws_secret_access_key ]
#     if (aws_config[section].keys & required_fields ).length == required_fields.length
#       profiles  << section
#     end
#   end
#   session[:profiles] = profiles
# end
# def get_mfa_device()
#   puts iam
#   the_device = ""
#   iam.list_mfa_devices.each do |device|
#     the_device = device
#   end
#   the_device
# end
# get '/mfa_device' do
#   content_type 'text/json'
#   get_mfa_device()
# end
# get '/profile' do
#   session[:current_profile].inspect
# end
#
# post 'profile' do
#   session[:current_profile] = params[:profile]
#   Aws.config.update({
#     region: 'us-east-1',
#     credentials: session[:current_profile]
#   })
#   session[:mfa_device] = get_mfa_device()
#   session.inspect
#   # begin
#   #   if session[:current_profile] == "" or session[:current_profile] == nil
#   #     current_profile = nil
#   #     current_role = nil
#   #     get_profile_data()
#   #     redirect '/', 303
#   #   elsif session[:profiles].include? session[:current_profile]
#   #     default_time = 86400
#   #     get_profile_data()
#   #     redirect '/', 303
#   #   else
#   #     status 404
#   #     "Couldn't change profile: no such profile '#{params[:profile]}'"
#   #   end
#   # rescue ProfileAuthException => e
#   #   status 401
#   #   content_type "text/plain"
#   #   e.message
#   # end
# end
#
#
# if settings.environment == :development
#
#   get '/debug/profile_auth' do
#       command= "aws sts get-caller-identity"
#       begin
#         env= {
#           "AWS_SESSION_TOKEN"=>profile_auth[current_profile]['SessionToken'],
#           "AWS_ACCESS_KEY_ID"=>profile_auth[current_profile]['AccessKeyId'],
#           "AWS_SECRET_ACCESS_KEY"=>profile_auth[current_profile]['SecretAccessKey'],
#         }
#         command= "aws sts get-caller-identity"
#       rescue NoMethodError
#         env = {
#           "PROFILE_AUTH"=>profile_auth.inspect
#         }
#         command= "env"
#       end
#       stdout, stderr, status = Open3.capture3( env, command)
#       content_type "text/json"
#       JSON.pretty_generate( { stdout: stdout, stderr: stderr, status: status } )
#   end
#
#   get '/debug' do
#       # sort_roles.call()
#     { :mfa_devices => mfa_devices,  :roles => roles, credentials: credentials, current_role: current_role, profile_auth: profile_auth }.to_json
#   end
#
#   get '/debug/used_roles' do
#     content_type 'text/json'
#     JSON.pretty_generate( { used_roles: used_roles } )
#   end
#
#   get '/debug/requesters' do
#     requester_roles.dump_json
#   end
#
# end
