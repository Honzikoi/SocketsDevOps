# Network Information
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "Private subnet ID"  
  value       = aws_subnet.private.id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.main.id
}

# Frontend Instance Information
output "frontend_instance_id" {
  description = "Frontend EC2 instance ID"
  value       = aws_instance.frontend.id
}

output "frontend_public_ip" {
  description = "Public IP of frontend server"
  value       = var.use_static_frontend_ip ? aws_eip.frontend[0].public_ip : aws_instance.frontend.public_ip
}

output "frontend_private_ip" {
  description = "Private IP of frontend server"
  value       = aws_instance.frontend.private_ip
}

output "frontend_dns" {
  description = "Public DNS of frontend server"
  value       = aws_instance.frontend.public_dns
}

output "frontend_security_group_id" {
  description = "Frontend security group ID"
  value       = aws_security_group.frontend.id
}

# Backend Instance Information
output "backend_instance_id" {
  description = "Backend EC2 instance ID"
  value       = aws_instance.backend.id
}

output "backend_private_ip" {
  description = "Private IP of backend server"
  value       = aws_instance.backend.private_ip
}

output "backend_security_group_id" {
  description = "Backend security group ID"
  value       = aws_security_group.backend.id
}

# Application URLs
output "application_url" {
  description = "Main application URL"
  value       = "http://${var.use_static_frontend_ip ? aws_eip.frontend[0].public_ip : aws_instance.frontend.public_ip}"
}

output "backend_health_check" {
  description = "Backend health check URL (internal)"
  value       = "http://${aws_instance.backend.private_ip}:${var.backend_port}/health"
}

# SSH Connection Information
output "ssh_command_frontend" {
  description = "SSH command to connect to frontend server"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${var.use_static_frontend_ip ? aws_eip.frontend[0].public_ip : aws_instance.frontend.public_ip}"
}

output "ssh_command_backend_via_frontend" {
  description = "SSH command to connect to backend server via frontend (bastion)"
  value       = "ssh -i ~/.ssh/id_rsa -J ubuntu@${var.use_static_frontend_ip ? aws_eip.frontend[0].public_ip : aws_instance.frontend.public_ip} ubuntu@${aws_instance.backend.private_ip}"
}

# Security Information
output "key_pair_name" {
  description = "Name of the created key pair"
  value       = aws_key_pair.main.key_name
}

# Resource Tags
output "common_tags" {
  description = "Common tags applied to resources"
  value = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
