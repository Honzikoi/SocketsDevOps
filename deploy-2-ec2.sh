#!/bin/bash

# Simple EC2 Deployment Script for SocketDevOps

set -e

echo "🚀 Deploying SocketDevOps to EC2..."

# Step 1: Apply Terraform
echo "📋 Creating EC2 infrastructure..."
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

# Get the EC2 public IP
EC2_IP=$(terraform output -raw instance_ip)
echo "✅ EC2 created at IP: $EC2_IP"

# Step 2: Wait for EC2 to be ready
echo "⏳ Waiting for EC2 to be ready (30 seconds)..."
sleep 30

# Step 3: Deploy your app (if you have SSH access)
echo "🐳 Deploying SocketDevOps..."

# Option A: If you have SSH key configured
# ssh -i ~/.ssh/your-key.pem ubuntu@$EC2_IP << 'EOF'
#   cd /home/ubuntu
#   git clone https://github.com/yourusername/socketdevops.git
#   cd socketdevops
#   docker-compose up -d --build
# EOF

# Option B: If no SSH, the user_data script will handle basic setup

echo "🎉 SocketDevOps deployment completed!"
echo "🌐 Your app will be available at:"
echo "   Frontend: http://$EC2_IP:3000"
echo "   Backend:  http://$EC2_IP:3001/health"
echo ""
echo "📝 Next steps:"
echo "1. SSH into your server: ssh -i ~/.ssh/your-key.pem ubuntu@$EC2_IP"
echo "2. Clone your repo: git clone <your-socketdevops-repo-url>"
echo "3. Run: docker-compose up -d --build"
echo "4. Access SocketDevOps at http://$EC2_IP:3000"

cd ..