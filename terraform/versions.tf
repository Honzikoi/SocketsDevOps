terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: Configure remote state backend
  # Uncomment and configure for team environments
  
  # backend "s3" {
  #   bucket         = "my-bucket"
  #   key            = "socketio-app/terraform.tfstate"
  #   region         = "eu-west-3"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-locks"
  # }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
}