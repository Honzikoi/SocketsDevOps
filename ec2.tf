resource "aws_instance" "app_instance" {
  ami           = "ami-04ec97dc75ac850b1"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public_subnet.id
  
  vpc_security_group_ids = [aws_security_group.instance_sg.id]
  key_name = "socketdevops-key"

  user_data = <<-EOF
    #!/bin/bash
    
    # Log everything
    exec > >(tee /var/log/user-data.log)
    exec 2>&1
    
    echo "Starting SocketDevOps deployment at $(date)"
    
    # Update system
    apt-get update -y
    
    # Install Docker
    apt-get install -y docker.io docker-compose git
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
    
    echo "Basic software installed at $(date)"
    
    # Wait for services to be ready
    sleep 120
    
    # Deploy SocketDevOps
    cd /home/ubuntu
    
    git clone https://github.com/Honzikoi/SocketsDevOps.git
    
    if [ -d "SocketDevOps" ]; then
        cd SocketDevOps
        chown -R ubuntu:ubuntu /home/ubuntu/socketdevops
        
        echo "Repository cloned, starting deployment at $(date)"
        
        # Run as ubuntu user
        sudo -u ubuntu bash -c "
            cd /home/ubuntu/socketdevops
            
            # Start with docker-compose
            docker-compose up -d --build
        "
        
        echo "Docker containers started at $(date)"
    else
        echo "Failed to clone repository at $(date)"
    fi
    
    # Final status
    echo "SocketDevOps deployment completed at $(date)" > /var/log/socketdevops-deployment.log
    docker ps >> /var/log/socketdevops-deployment.log
  EOF

  tags = {
    Name = "socketdevops-instance"
  }
}