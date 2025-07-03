terraform {
  backend "s3" {
    bucket = "socketsdevops-terraform-state-eu-west-3"
    key    = "socketsdevops/terraform.tfstate" 
    region = "eu-west-3"
  }
}