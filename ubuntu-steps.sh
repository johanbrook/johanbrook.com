#!/usr/env/bin bash

apt update && apt upgrade -y

USER="dev"

adduser "$USER"
usermod -aG sudo "$USER"

# SSH
mkdir -p "/home/$USER/.ssh"
cp ~/.ssh/authorized_keys "/home/$USER/.ssh/"
chown "$USER":"$USER" "/home/$USER/.ssh"
chmod go-rwx "/home/$USER/.ssh" -R

# log in as dev@<ip>

## Lock down SSH

sudo apt install micro # sane editor

# Ensure these settings:
# Port XXX
# PermitRootLogin no
# PubkeyAuthentication yes
# PasswordAuthentication no
# UsePAM no
# AllowUsers $USER

# protect against brute force SSH
sudo apt install fail2ban
sudo systemctl enable --now fail2ban

# Time

sudo timedatectl set-timezone UTC
timedatectl

# Firewall

sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose

# Automatic security updates

sudo apt install unattended-upgrades
sudo micro /etc/apt/apt.conf.d/50unattended-upgrades
# set:
#
# Unattended-Upgrade::Automatic-Reboot "true";
# Unattended-Upgrade::Automatic-Reboot-Time "02:00";
#
# verify with:
# sudo unattended-upgrade --dry-run --debug

# Nginx

sudo apt install nginx
sudo ufw allow 'Nginx Full'
sudo apt install git

sudo mkdir -p /var/www/site/
sudo chown -R dev:dev /var/www/site
sudo chmod -R 755 /var/www/site
sudo ln -s /etc/nginx/sites-available/site /etc/nginx/sites-enabled/
# test conf:
sudo nginx -t && sudo systemctl reload nginx

