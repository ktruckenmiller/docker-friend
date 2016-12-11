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
require 'pp'
require 'redis'
require 'rack'
require 'rack/session/redis'
require 'sinatra/base'
require_relative 'helpers'
class DockerFriend < Sinatra::Base
  enable :sessions
  set :root, File.dirname(__FILE__)
  set :bind, '0.0.0.0'
  set :port, 9292

  use Rack::Session::Redis, redis_server: 'redis://redis'




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
      redirect '/local', 303
    else
      erb :main_layout, :layout => false do
        erb :profile, {
          locals: { profiles: session[:profiles] }
        }
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

  get '/local' do
    if session[:current_profile]
      erb :main_layout, :layout => false do
        @current_profile = session[:current_profile]
        erb :local do
          @cloud = true
          erb :navbar
        end
      end
    else
      redirect '/', 303
    end
  end

  get '/cloud' do
    erb :main_layout do
      erb :cloud do
        @active = 'cloud'
        erb :navbar
      end
    end

  end

  get %r|/latest/meta-data/iam/security-credentials/(.+)| do
    p "Security creds PLUS"
    p request.ip
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
  get %r|^/config/current$| do
    p "Config current"
    p request.ip
  end
  get %r|^/config/(.+)/?$| do
    p "Config plus"
    p request.ip
  end
  get %r|/latest/meta-data/iam/security-credentials/?$| do
    p "Security creds QUESTION"

    Docker::Container.all(:all => true).map{ |c|

      pp request.ip
      pp c.info["NetworkSettings"]["Networks"]
      pp c.info["Image"]

    }
    ""
    # {
    #   Code: "Success",
    #   LastUpdated: Time.new.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
    #   Type: "AWS-HMAC",
    #   AccessKeyId: data['Credentials']['AccessKeyId'],
    #   SecretAccessKey: data['Credentials']['SecretAccessKey'],
    #   Token: data['Credentials']['SessionToken'],
    #   Expiration: data['Credentials']['Expiration']
    # }

    # content_type 'text/json'
    # JSON.pretty_generate(Docker::Container.all(:all => true).map{|c| c.info})

  end

  get '/session' do
    content_type 'text/json'
    JSON.pretty_generate(session.inspect)
  end

  get '/roles' do
    content_type 'text/json'
    JSON.pretty_generate(get_roles)
  end
  get '/images' do
    images = get_images
    content_type 'text/json'
    JSON.pretty_generate(images)
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



end
