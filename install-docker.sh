#!/bin/bash

# Install Docker in WSL Ubuntu
echo "Installing Docker Engine..."

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update apt and install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo service docker start

# Add user to docker group
sudo usermod -aG docker $USER

echo ""
echo "Docker installation complete!"
echo "Run 'docker --version' to verify installation"
echo "Run 'docker compose version' to verify Docker Compose"
echo ""
echo "Note: You may need to logout/login or run 'newgrp docker' for group changes to take effect"
