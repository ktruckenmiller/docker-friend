FROM ruby:2.3
MAINTAINER kmtruckenmiller@gmail.com
RUN apt-get update
RUN apt-get install -y  python-pip python-dev
RUN pip install awscli
RUN curl -sSL https://get.docker.com/ | sh
ADD ./Gemfile /code/Gemfile
ADD ./Gemfile.lock /code/Gemfile.lock
WORKDIR /code
RUN bundle install
ADD . /code
CMD ["rackup", "-o", "0.0.0.0"]
