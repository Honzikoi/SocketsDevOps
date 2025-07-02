terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "socketdevops/terraform.tfstate" 
    region = "eu-west-3"
  }
}