#!/bin/bash

# Deploy Socket.IO App to AWS
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
PROJECT_DIR=$(pwd)
TERRAFORM_DIR="${PROJECT_DIR}/terraform"
ANSIBLE_DIR="${PROJECT_DIR}/ansible"

# Check if required tools are installed
check_dependencies() {
    print_step "1/8 Checking dependencies..."
    
    local missing_tools=()
    
    if ! command -v terraform &> /dev/null; then
        missing_tools+=("terraform")
    fi
    
    if ! command -v ansible &> /dev/null; then
        missing_tools+=("ansible")
    fi
    
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install them first:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                terraform) echo "  - Terraform: https://terraform.io/downloads" ;;
                ansible) echo "  - Ansible: pip install ansible" ;;
                aws) echo "  - AWS CLI: https://aws.amazon.com/cli/" ;;
            esac
        done
        exit 1
    fi
    
    # Check if directories exist
    if [ ! -d "./frontend" ]; then
        print_error "Frontend directory not found. Please ensure your frontend code is in ./frontend/"
        exit 1
    fi
    
    if [ ! -d "./backend" ]; then
        print_error "Backend directory not found. Please ensure your backend code is in ./backend/"
        exit 1
    fi
    
    # Check if Terraform files exist
    if [ ! -f "$TERRAFORM_DIR/main.tf" ]; then
        print_error "Terraform files not found in $TERRAFORM_DIR/"
        exit 1
    fi
    
    # Check if Ansible files exist
    if [ ! -f "$ANSIBLE_DIR/playbook.yaml" ]; then
        print_error "Ansible playbook not found in $ANSIBLE_DIR/"
        exit 1
    fi
    
    print_status "All dependencies and directories are ready."
}

# Generate SSH key pair if it doesn't exist
generate_ssh_key() {
    print_step "2/8 Checking SSH key pair..."
    
    if [ ! -f ~/.ssh/id_rsa ]; then
        print_status "Generating SSH key pair..."
        ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa -N ""
        print_status "SSH key pair generated."
    else
        print_status "SSH key pair already exists."
    fi
}

# Initialize and apply Terraform
deploy_infrastructure() {
    print_step "3/8 Deploying AWS infrastructure..."
    
    cd "$TERRAFORM_DIR"
    
    print_status "Initializing Terraform..."
    terraform init
    
    print_status "Validating Terraform configuration..."
    terraform validate
    
    print_status "Planning Terraform deployment..."
    terraform plan -var-file="terraform.tfvars" -out=tfplan
    
    print_status "Applying Terraform configuration..."
    terraform apply tfplan
    
    rm -f tfplan
    cd "$PROJECT_DIR"
    
    print_status "Infrastructure deployed successfully!"
}

# Update inventory file with actual IPs
update_inventory() {
    print_step "4/8 Updating Ansible inventory..."
    
    cd "$TERRAFORM_DIR"
    
    FRONTEND_IP=$(terraform output -raw frontend_public_ip)
    BACKEND_IP=$(terraform output -raw backend_private_ip)
    
    cd "$PROJECT_DIR"
    
    # Create inventory from template or update existing
    if [ ! -f "$ANSIBLE_DIR/inventory.ini" ]; then
        print_error "Ansible inventory template not found!"
        exit 1
    fi
    
    # Update inventory with actual IPs
    sed -i.bak "s/FRONTEND_PUBLIC_IP/$FRONTEND_IP/g" "$ANSIBLE_DIR/inventory.ini"
    sed -i.bak "s/BACKEND_PRIVATE_IP/$BACKEND_IP/g" "$ANSIBLE_DIR/inventory.ini"
    
    print_status "Inventory updated with IPs:"
    print_status "  Frontend: $FRONTEND_IP"
    print_status "  Backend: $BACKEND_IP"
}

# Wait for instances to be ready
wait_for_instances() {
    print_step "5/8 Waiting for instances to be ready..."
    
    cd "$TERRAFORM_DIR"
    FRONTEND_IP=$(terraform output -raw frontend_public_ip)
    cd "$PROJECT_DIR"
    
    print_status "Waiting for SSH to be available on frontend server..."
    local max_attempts=30
    local attempt=1
    
    while ! nc -z "$FRONTEND_IP" 22 2>/dev/null; do
        if [ $attempt -ge $max_attempts ]; then
            print_error "Timeout waiting for SSH. Check AWS Console for instance status."
            exit 1
        fi
        print_status "Attempt $attempt/$max_attempts - waiting for SSH..."
        sleep 10
        ((attempt++))
    done
    
    # Additional wait for cloud-init to complete
    print_status "Waiting for instance initialization to complete..."
    sleep 30
    
    print_status "Instances are ready!"
}

# Run Ansible playbook
configure_servers() {
    print_step "6/8 Configuring servers with Ansible..."
    
    cd "$ANSIBLE_DIR"
    
    # Check if ansible.cfg exists
    if [ ! -f "ansible.cfg" ]; then
        print_warning "ansible.cfg not found, using default Ansible configuration"
    fi
    
    # Add SSH key to agent
    eval $(ssh-agent -s) > /dev/null 2>&1
    ssh-add ~/.ssh/id_rsa > /dev/null 2>&1
    
    # Install Ansible requirements if they exist
    if [ -f "requirements.yml" ]; then
        print_status "Installing Ansible Galaxy requirements..."
        ansible-galaxy install -r requirements.yml
    fi
    
    # Run the playbook with verbose output
    print_status "Running Ansible playbook..."
    ansible-playbook -i inventory.ini playbook.yaml -v
    
    cd "$PROJECT_DIR"
    
    print_status "Server configuration completed!"
}

# Verify deployment
verify_deployment() {
    print_step "7/8 Verifying deployment..."
    
    cd "$TERRAFORM_DIR"
    FRONTEND_IP=$(terraform output -raw frontend_public_ip)
    BACKEND_IP=$(terraform output -raw backend_private_ip)
    cd "$PROJECT_DIR"
    
    print_status "Testing frontend accessibility..."
    if curl -s -o /dev/null -w "%{http_code}" "http://$FRONTEND_IP" | grep -q "200\|301\|302"; then
        print_status "✅ Frontend is accessible"
    else
        print_warning "⚠️  Frontend may not be fully ready yet"
    fi
    
    print_status "Testing backend health check via frontend..."
    if curl -s "http://$FRONTEND_IP/api/rooms" > /dev/null 2>&1; then
        print_status "✅ Backend API is accessible"
    else
        print_warning "⚠️  Backend API may not be ready yet"
    fi
    
    # Check containers via SSH
    print_status "Checking Docker containers..."
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$FRONTEND_IP "docker ps" > /dev/null 2>&1; then
        print_status "✅ Frontend Docker container is running"
    else
        print_warning "⚠️  Could not verify frontend container"
    fi
}

# Display deployment information
show_deployment_info() {
    print_step "8/8 Deployment completed!"
    
    cd "$TERRAFORM_DIR"
    local frontend_ip=$(terraform output -raw frontend_public_ip 2>/dev/null || echo "N/A")
    local backend_ip=$(terraform output -raw backend_private_ip 2>/dev/null || echo "N/A")
    cd "$PROJECT_DIR"
    
    echo ""
    echo "🎉 ================================"
    echo "🎉   DEPLOYMENT SUCCESSFUL!"
    echo "🎉 ================================"
    echo ""
    echo "📱 APPLICATION ACCESS:"
    echo "   Frontend URL: http://$frontend_ip"
    echo "   Chat App: Create rooms and start chatting!"
    echo "   Trivia Game: Join rooms and play trivia games"
    echo ""
    echo "🔧 SERVER ACCESS:"
    echo "   Frontend SSH: ssh -i ~/.ssh/id_rsa ubuntu@$frontend_ip"
    echo "   Backend SSH: ssh -i ~/.ssh/id_rsa -J ubuntu@$frontend_ip ubuntu@$backend_ip"
    echo ""
    echo "🐳 DOCKER MANAGEMENT:"
    echo "   View logs: ssh ubuntu@$frontend_ip 'docker logs frontend-container'"
    echo "   Restart: ssh ubuntu@$frontend_ip 'docker restart frontend-container'"
    echo "   Update app: Run this script again to redeploy"
    echo ""
    echo "📊 MONITORING:"
    echo "   Backend health: curl http://$frontend_ip/health"
    echo "   Container status: ssh ubuntu@$frontend_ip 'docker ps'"
    echo ""
    echo "💰 COST ESTIMATE: ~$50-60/month"
    echo "   (2 x t2.micro + NAT Gateway + storage)"
    echo ""
    echo "🛑 TO DESTROY: cd terraform && terraform destroy"
    echo ""
}

# Cleanup function
cleanup() {
    print_warning "Script interrupted! Cleaning up..."
    # Kill ssh-agent if we started it
    if [ ! -z "$SSH_AGENT_PID" ]; then
        kill $SSH_AGENT_PID > /dev/null 2>&1
    fi
    exit 1
}

# Main deployment function
main() {
    echo "🚀 Socket.IO Chat App Deployment Script"
    echo "========================================"
    echo ""
    
    check_dependencies
    generate_ssh_key
    deploy_infrastructure
    update_inventory
    wait_for_instances
    configure_servers
    verify_deployment
    show_deployment_info
    
    print_status "🎉 Deployment script completed successfully!"
}

# Handle script interruption
trap cleanup INT TERM

# Check for command line arguments
case "${1:-deploy}" in
    "deploy")
        main "$@"
        ;;
    "destroy")
        print_warning "🛑 DESTROYING INFRASTRUCTURE..."
        cd "$TERRAFORM_DIR"
        terraform destroy -var-file="terraform.tfvars"
        cd "$PROJECT_DIR"
        print_status "Infrastructure destroyed."
        ;;
    "update")
        print_status "🔄 UPDATING APPLICATION..."
        cd "$ANSIBLE_DIR"
        ansible-playbook -i inventory.ini playbook.yaml --tags "deployment"
        cd "$PROJECT_DIR"
        print_status "Application updated."
        ;;
    "status")
        cd "$TERRAFORM_DIR"
        if [ -f "terraform.tfstate" ]; then
            terraform output
        else
            print_error "No deployment found."
        fi
        cd "$PROJECT_DIR"
        ;;
    *)
        echo "Usage: $0 {deploy|destroy|update|status}"
        echo "  deploy  - Full deployment (default)"
        echo "  destroy - Destroy infrastructure"  
        echo "  update  - Update application only"
        echo "  status  - Show deployment status"
        exit 1
        ;;
esac