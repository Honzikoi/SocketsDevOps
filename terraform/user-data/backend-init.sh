#!/bin/bash
set -e

# Variables
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> /var/log/user-data.log
}

log "Starting backend initialization for $PROJECT_NAME ($ENVIRONMENT)"

# Update system
log "Updating system packages"
apt-get update -y
apt-get upgrade -y

# Install basic packages
log "Installing basic packages"
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    tree \
    jq \
    awscli

# Create application directory
log "Creating application directory"
mkdir -p /var/www/backend
chown ubuntu:ubuntu /var/www/backend

# Create data directory and mount data volume
log "Setting up data volume"
mkdir -p /var/www/backend/data
chown ubuntu:ubuntu /var/www/backend/data

# Format and mount the additional EBS volume for data
if [ -b /dev/xvdf ]; then
    log "Formatting and mounting data volume"
    mkfs.ext4 /dev/xvdf
    mount /dev/xvdf /var/www/backend/data
    echo '/dev/xvdf /var/www/backend/data ext4 defaults,nofail 0 2' >> /etc/fstab
    chown ubuntu:ubuntu /var/www/backend/data
fi

# Install CloudWatch agent (optional)
if [ "$ENVIRONMENT" = "prod" ]; then
    log "Installing CloudWatch agent for production"
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    dpkg -i -E ./amazon-cloudwatch-agent.deb
fi

log "Backend initialization completed successfully"