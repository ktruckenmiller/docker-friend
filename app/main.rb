require 'sinatra'
# require 'sinatra/base'
require 'aws-sdk'
require 'sinatra/reloader' if development?
require 'json'
require 'open3'
require 'docker'
require 'inifile'
require 'zlib'
require 'date'
require 'redis'
require 'sinatra/base'
require_relative 'helpers'
class DockerFriend < Sinatra::Base
  enable :sessions
  set :root, File.dirname(__FILE__)
  set :bind, '0.0.0.0'
  set :port, 9292





  configure :development do
    register Sinatra::Reloader
    also_reload File.dirname(__FILE__) + '/helpers.rb'
  end


  # Helpers
  helpers Sinatra::DockerFriend::Helpers

  # # Routes
  # register Sinatra::DockerFriend::Routing::Sessions



  before do
    # session = 
    current_profile_expired?

    if !is_local_req?
      puts 'Request IP: ' + request.ip
      redirect 'http://google.com'
    end
    if session[:profiles].nil? || session[:profiles].empty?
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

  get %r|/latest/meta-data/iam/security-credentials/(.+)| do
    print request.ip
    # requester_roles.log_requester request
    # if current_profile
    #   if params['captures'].first == current_role
    #     data = JSON.pretty_generate credentials
    #     content_type 'text/json'
    #     etag Zlib::crc32(data).to_s
    #     last_modified DateTime.parse( credentials[:LastUpdated] )
    #     data
    #   else
    #     status 404
    #   end
    # end
  end
  get %r|/latest/meta-data/iam/security-credentials/?$| do

    p request.ip
    # redis.set("mykey", "hello world")
    #
    # p redis.get("mykey")

    put("bostonians", {
        shoey: "you"
      })
    p get("bostonians")
    content_type 'text/json'
    JSON.pretty_generate(Docker::Container.all(:all => true).map{|c| c.info})
  #  if current_profile
  #     if current_role
  #       current_role
  #     end
  #   end
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
