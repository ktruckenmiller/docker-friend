module Sinatra
  module DockerFriend
    module Helpers
      def is_local_req?
        request.ip.to_s == "127.0.0.1" || request.ip.to_s == "::1" || (request.ip.to_s.include? "172.22.0.")
      end

      def get_profile_environments
        profiles = []
        session[:profile_path] = "~/.aws/credentials"
        begin
          session[:profile_path] = File.expand_path session[:profile_path]
        rescue ArgumentError => e # docker container maybe?
          session[:profile_path] = "/code/.aws/credentials"
          ENV['HOME'] = '/code'
        end
        aws_config = IniFile.load( session[:profile_path] )
        aws_config.each_section do |section|
          required_fields = %w[ aws_access_key_id aws_secret_access_key ]
          if (aws_config[section].keys & required_fields ).length == required_fields.length
            profiles  << section
          end
        end

        session[:profiles] = profiles
      end

      def set_creds

        creds = Aws::SharedCredentials.new({profile_name: session[:current_profile], correctClockSkew: true})
        Aws.config.update({
          region: 'us-east-1',
          credentials: creds
        })
        get_mfa_device
        if !session[:profile_mfa].empty?
          begin
            res = sts.get_session_token(duration_seconds: 3600, serial_number: session[:mfa_device], token_code: session[:profile_mfa])

            session[:elevated] = true
            session[session[:current_profile]] = {
              access_key_id: res.credentials['access_key_id'],
              secret_access_key: res.credentials['secret_access_key'],
              session_token: res.credentials['session_token'],
              expiration: res.credentials['expiration'],
              containers: []
            }
            creds = Aws::Credentials.new(
              res.credentials['access_key_id'],
              res.credentials['secret_access_key'],
              res.credentials['session_token']
            )
            Aws.config.update({
              region: 'us-east-1',
              credentials: creds
            })

            { err: false }
          rescue Exception => e
            p "RESCUE----"
            p e
            session[session[:current_profile]] = {
              containers: []
            }
            session[:profile_mfa] = ""
            session[:elevated] = false
            { err: true }
          end

        else
          session[session[:current_profile]] = {
            containers: []
          }
          session[:profile_mfa] = ""
          session[:elevated] = false
          { err: false}
        end

      end

      def current_profile_expired?
        begin
          if session[session[:current_profile]][:expiration] < Time.now
            session[:elevated] = false
            creds = Aws::SharedCredentials.new({profile_name: session[:current_profile], correctClockSkew: true})
            Aws.config.update({
              region: 'us-east-1',
              credentials: creds
            })
          end
        rescue
          session[:elevated] = false
        end
      end

      def iam
        Aws::IAM::Client.new
      end

      def sts
        Aws::STS::Client.new
      end

      def get_mfa_device
        res = iam.list_mfa_devices()
        session[:mfa_device] = res.mfa_devices[0].serial_number
      end

      def get_roles
        roles = []
        iam.list_roles.each do |response|
          roles << response.roles.map(&:arn)
        end
        roles.flatten
      end

      #### docker helpers
      def get_containers
        containers = Docker::Container.all(:all => true)
        containers.map { |c|
          c.json
        }
      end

      def authenticate(container_id, role, mfa_token)
        begin
          if session[:elevated]
            res = sts.assume_role({role_arn: role, serial_number: session[:mfa_device], duration_seconds: 129600, token_code: mfa_token, role_session_name: container_id})
          else
            res = sts.assume_role({role_arn: role, serial_number: session[:mfa_device], duration_seconds: 3600, token_code: mfa_token, role_session_name: container_id})
          end
          container_role = Hash.new
          container_role['id'] = container_id
          container_role['credentials'] = {
              access_key_id: res.credentials[:access_key_id],
              secret_access_key: res.credentials[:secret_access_key],
              session_token: res.credentials[:session_token],
              expiration: res.credentials[:expiration]
            }
          container_role['assumed_role_user'] = {
              assumed_role_id: res.assumed_role_user[:assumed_role_id],
              arn: res.assumed_role_user[:arn]
            }
          session[session[:current_profile]][:containers] << container_role
          {err: false}
        rescue Exception => e
          p e.inspect
          {err: true, res: e}
        end

      end

      def get_creds_file(container_id)
        puts session.inspect

        role = session[session[:current_profile]][:containers].find {  |c|
            c['id'] == container_id
        }
        if !role['credentials'].empty?
          final_str = "[default]\n"
          final_str << "aws_access_key_id=" + role['credentials'][:access_key_id] + "\n"
          final_str << "aws_secret_access_key=" + role['credentials'][:secret_access_key] + "\n"
          final_str << "aws_session_token=" + role['credentials'][:session_token] + "\n"

          final_str
        end

      end

      def put_file_in_container(file, container_id)
        container = Docker::Container.get(container_id)
        begin
          user = container.exec(['whoami']).flatten[0].gsub!(/\W+/, '')
          if user == 'root'
            user_dir = "/" + user
          else
            user_dir = "/home/"+ user
          end
        rescue
          user_dir = "/root"
        end
        begin
          container.store_file(user_dir + "/.aws/credentials", file)
          {err: false, res: "Successfully stored in " + container_id}
        rescue Exception => e
          {err: true, res: e}
        end
      end
    end
  end
end
