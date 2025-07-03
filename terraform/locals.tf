# Local values for computed data and common configurations
locals {
  # Common tags applied to all resources
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = formatdate("YYYY-MM-DD", timestamp())
    },
    var.additional_tags
  )

  # Network calculations
  vpc_cidr_parts = split("/", var.vpc_cidr)
  vpc_network    = local.vpc_cidr_parts[0]
  vpc_prefix     = local.vpc_cidr_parts[1]

  # Availability zones (use first 2 for redundancy)
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)

  # Instance configurations
  frontend_config = {
    name          = "${var.project_name}-frontend"
    instance_type = var.instance_type
    port          = var.frontend_port
    health_check  = "/health"
  }

  backend_config = {
    name          = "${var.project_name}-backend"
    instance_type = var.instance_type
    port          = var.backend_port
    health_check  = "/health"
  }

  # Security group rules
  frontend_ingress_rules = [
    {
      description = "HTTP"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
      description = "HTTPS"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  ]

  backend_ingress_rules = [
    {
      description     = "Socket.IO Server"
      from_port       = var.backend_port
      to_port         = var.backend_port
      protocol        = "tcp"
      security_groups = [aws_security_group.frontend.id]
    },
    {
      description = "SSH from public subnet"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.public_subnet_cidr]
    }
  ]

  # Application endpoints
  application_endpoints = {
    frontend_app    = "http://${var.use_static_frontend_ip ? aws_eip.frontend[0].public_ip : aws_instance.frontend.public_ip}"
    backend_health  = "http://${aws_instance.backend.private_ip}:${var.backend_port}/health"
    backend_api     = "http://${aws_instance.backend.private_ip}:${var.backend_port}/api"
    socket_io       = "http://${aws_instance.backend.private_ip}:${var.backend_port}/socket.io"
  }

  # User data scripts
  frontend_user_data = base64encode(templatefile("${path.module}/user-data/frontend-init.sh", {
    project_name = var.project_name
    environment  = var.environment
  }))

  backend_user_data = base64encode(templatefile("${path.module}/user-data/backend-init.sh", {
    project_name = var.project_name
    environment  = var.environment
  }))

  # Cost estimation (approximate monthly costs in USD)
  cost_estimates = {
    ec2_instances = {
      frontend = var.instance_type == "t2.micro" ? 8.50 : var.instance_type == "t2.small" ? 17.00 : 34.00
      backend  = var.instance_type == "t2.micro" ? 8.50 : var.instance_type == "t2.small" ? 17.00 : 34.00
    }
    networking = {
      nat_gateway = 32.85
      eip         = var.use_static_frontend_ip ? 3.65 : 0
    }
    storage = {
      frontend_root = var.root_volume_size * 0.10
      backend_root  = var.root_volume_size * 0.10
      backend_data  = var.data_volume_size * 0.10
    }
  }

  # Environment-specific configurations
  env_config = {
    dev = {
      backup_retention_days = 7
      monitoring_enabled    = false
      multi_az             = false
    }
    staging = {
      backup_retention_days = 14
      monitoring_enabled    = true
      multi_az             = false
    }
    prod = {
      backup_retention_days = 30
      monitoring_enabled    = true
      multi_az             = true
    }
  }

  # Current environment configuration
  current_env_config = local.env_config[var.environment]
}