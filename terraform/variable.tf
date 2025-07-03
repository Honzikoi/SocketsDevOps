# AWS Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in the format: us-east-1, eu-west-1, etc."
  }
}

# Project Configuration
variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "socketio-app"
  
  validation {
    condition = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid CIDR block."
  }
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
  
  validation {
    condition = can(cidrhost(var.public_subnet_cidr, 0))
    error_message = "Public subnet CIDR must be a valid CIDR block."
  }
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"
  
  validation {
    condition = can(cidrhost(var.private_subnet_cidr, 0))
    error_message = "Private subnet CIDR must be a valid CIDR block."
  }
}

# Security Configuration
variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks allowed to SSH to frontend"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# EC2 Configuration
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
  
  validation {
    condition = contains([
      "t2.micro", "t2.small", "t2.medium", 
      "t3.micro", "t3.small", "t3.medium",
      "t3a.micro", "t3a.small", "t3a.medium"
    ], var.instance_type)
    error_message = "Instance type must be a valid t2, t3, or t3a instance type."
  }
}

variable "root_volume_size" {
  description = "Size of root EBS volume in GB"
  type        = number
  default     = 20
  
  validation {
    condition = var.root_volume_size >= 8 && var.root_volume_size <= 100
    error_message = "Root volume size must be between 8 and 100 GB."
  }
}

variable "data_volume_size" {
  description = "Size of data EBS volume for backend in GB"
  type        = number
  default     = 10
  
  validation {
    condition = var.data_volume_size >= 5 && var.data_volume_size <= 50
    error_message = "Data volume size must be between 5 and 50 GB."
  }
}

# SSH Configuration
variable "public_key_path" {
  description = "Path to the public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# Feature Flags
variable "enable_termination_protection" {
  description = "Enable EC2 instance termination protection"
  type        = bool
  default     = false
}

variable "use_static_frontend_ip" {
  description = "Use Elastic IP for frontend instance"
  type        = bool
  default     = false
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = false
}

# Application Configuration
variable "frontend_port" {
  description = "Port for frontend application"
  type        = number
  default     = 80
}

variable "backend_port" {
  description = "Port for backend Socket.IO server"
  type        = number
  default     = 3001
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}