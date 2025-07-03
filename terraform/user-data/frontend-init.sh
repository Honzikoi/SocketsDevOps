#!/bin/bash
set -e

# Variables
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> /var/log/user-data.log
}

log "Starting frontend initialization for $PROJECT_NAME ($ENVIRONMENT)"

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
mkdir -p /var/www/frontend
chown ubuntu:ubuntu /var/www/frontend

# Install CloudWatch agent (optional)
if [ "$ENVIRONMENT" = "prod" ]; then
    log "Installing CloudWatch agent for production"
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    dpkg -i -E ./amazon-cloudwatch-agent.deb
fi

log "Frontend initialization completed successfully"