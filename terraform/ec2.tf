resource "aws_instance" "app_instance" {
  ami           = "ami-0fc5d935ebf8bc3bc" # Ubuntu 22.04 eu-west-3
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public_subnet.id
  security_groups = [aws_security_group.instance_sg.name]

  key_name = "your-key-name" # Change with your AWS key name

  tags = {
    Name = "ci-cd-app"
  }

  provisioner "remote-exec" {
    inline = ["echo EC2 started"]
    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("~/.ssh/your-key.pem")
      host        = self.public_ip
    }
  }
}
