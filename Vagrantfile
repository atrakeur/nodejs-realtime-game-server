VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	config.vm.box = "hashicorp/precise64"
	config.vm.box_check_update = false

	config.vm.network "forwarded_port", guest: 8080, host: 8080

	config.vm.synced_folder ".", "/vagrant"
	
	config.vm.provider "virtualbox" do |v|
		v.memory = 1024
	end

	config.vm.provision :shell, :path => "provision.sh"
end
