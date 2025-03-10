#!/bin/bash

# Test script for Docker setup

echo "===== Testing Docker setup for PDF Annotation Tool ====="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Warning: Docker Compose is not installed. You can still use plain Docker commands."
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t pdf-annotation-tool-test .
if [ $? -ne 0 ]; then
    echo "Error: Failed to build Docker image"
    exit 1
fi

# Run the container in detached mode
echo "Starting container..."
CONTAINER_ID=$(docker run -d -p 9090:80 pdf-annotation-tool-test)
if [ $? -ne 0 ]; then
    echo "Error: Failed to start container"
    exit 1
fi

# Give the container a moment to start
echo "Waiting for container to initialize..."
sleep 3

# Test if the server is responding
echo "Testing HTTP connection..."
if command -v curl &> /dev/null; then
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090)
    if [ "$response" != "200" ]; then
        echo "Error: Server responded with status $response, expected 200"
        docker stop $CONTAINER_ID > /dev/null
        docker rm $CONTAINER_ID > /dev/null
        exit 1
    fi
else
    echo "Warning: curl not found, skipping HTTP test"
fi

# Stop and remove the container
echo "Cleaning up..."
docker stop $CONTAINER_ID > /dev/null
docker rm $CONTAINER_ID > /dev/null

echo "===== Docker test completed successfully! ====="
echo "You can now use the Docker setup with:"
echo "docker-compose up -d"
echo "And access the application at http://localhost:8080"
exit 0 