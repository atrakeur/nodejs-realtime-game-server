#!/usr/bin/env bash

# Provision file used by vagrant to bootstrap the vm

# apt get
# -------
apt-get update &> /dev/null
apt-get install -y python-software-properties
add-apt-repository -y ppa:chris-lea/node.js
apt-get update &> /dev/null

apt-get install -y curl  &> /dev/null

apt-get install -y git
apt-get install -y npm

npm install -g typescript

gem install rhc
