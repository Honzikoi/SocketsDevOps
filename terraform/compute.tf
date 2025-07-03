# Frontend EC2 Instance
resource "aws_instance" "frontend" {
  ami                     = data.aws_ami.ubuntu.id
  instance_type           = var.instance_type
  key_name                = aws_key_pair.main.key_name
  vpc_security_group_ids  = [aws_security_group.frontend.id]
  subnet_id               = aws_subnet.public.id
  disable_api_termination = var.enable_termination_protection

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-frontend-root"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    echo "Frontend server initialized" > /var/log/init.log
  EOF
  )

  tags = {
    Name        = "${var.project_name}-frontend"
    Type        = "Frontend"
    Environment = var.environment
    Project     = var.project_name
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Backend EC2 Instance
resource "aws_instance" "backend" {
  ami                     = data.aws_ami.ubuntu.id
  instance_type           = var.instance_type
  key_name                = aws_key_pair.main.key_name
  vpc_security_group_ids  = [aws_security_group.backend.id]
  subnet_id               = aws_subnet.private.id
  disable_api_termination = var.enable_termination_protection

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-backend-root"
    }
  }

  # Additional EBS volume for database storage
  ebs_block_device {
    device_name           = "/dev/sdf"
    volume_type           = "gp3"
    volume_size           = var.data_volume_size
    delete_on_termination = false
    encrypted             = true

    tags = {
      Name = "${var.project_name}-backend-data"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    mkdir -p /var/www/backend/data
    echo "Backend server initialized" > /var/log/init.log
  EOF
  )

  tags = {
    Name        = "${var.project_name}-backend"
    Type        = "Backend"
    Environment = var.environment
    Project     = var.project_name
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Optional: Elastic IP for frontend (for static IP)
resource "aws_eip" "frontend" {
  count    = var.use_static_frontend_ip ? 1 : 0
  instance = aws_instance.frontend.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-frontend-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# Optional: Launch Template for Auto Scaling (future use)
resource "aws_launch_template" "frontend" {
  name_prefix   = "${var.project_name}-frontend-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [aws_security_group.frontend.id]

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = var.root_volume_size
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    echo "Frontend template server initialized" > /var/log/init.log
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-frontend-from-template"
      Type        = "Frontend"
      Environment = var.environment
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}