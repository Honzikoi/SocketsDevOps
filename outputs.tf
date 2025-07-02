output "instance_ip" {
  description = "Public IP address of the SocketDevOps EC2 instance"
  value       = aws_instance.app_instance.public_ip
}

output "instance_id" {
  description = "ID of the SocketDevOps EC2 instance"
  value       = aws_instance.app_instance.id
}

output "frontend_url" {
  description = "URL to access SocketDevOps frontend"
  value       = "http://${aws_instance.app_instance.public_ip}:3000"
}

output "backend_url" {
  description = "URL to access SocketDevOps backend API"
  value       = "http://${aws_instance.app_instance.public_ip}:3001"
}

output "ssh_connect" {
  description = "Command to SSH into the instance (once you set up keys)"
  value       = "ssh ubuntu@${aws_instance.app_instance.public_ip}"
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.app_instance.public_ip
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_instance.app_instance.public_ip}:3000"
}