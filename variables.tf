// variable declarations for main.tf

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-west-3" # Paris
}

// variable declarations for vpc

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
  default     = "socketdevops-vpc"
}

// variable declarations for route table

variable "public_route_table_name" {
  description = "Name of the public route table"
  type        = string
  default     = "socketdevops-public-rt"
}

// variable declarations for subnet

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_name" {
  description = "Name of the public subnet"
  type        = string
  default     = "socketdevops-public-subnet"
}

// variable declarations for gateway

variable "gateway_name" {
  description = "Name of the Internet Gateway"
  type        = string
  default     = "socketdevops-igw"
}

// variable declarations for the EC2 instance

variable "instance_name" {
  description = "Name of the EC2 instance"
  type        = string
  default     = "SocketsDevOps-instance"
}

variable "instance_type" {
  description = "Type of the EC2 instance"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the key pair to use for the EC2 instance"
  type        = string
  default     = "socketdevops-key"
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-04ec97dc75ac850b1"
}

variable "security_group_name" {
  description = "Name of the security group for the EC2 instance"
  type        = string
  default     = "socketdevops-sg"
}

// variable declarations for availability zone

variable "availability_zone" {
  description = "Availability zone for the subnet"
  type        = string
  default     = "eu-west-3a"
}


