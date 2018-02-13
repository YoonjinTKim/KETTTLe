# Use official node image as base
FROM node:8.9.4

# Create working directory
RUN mkdir -p /usr/ketttle

# Link working directory
WORKDIR /usr/ketttle

# Copy over package.json file
COPY package.json /usr/ketttle

# Install node dependencies
RUN npm install

# Docker is a virtualized OS so it cannot access the private key unless it exists in itself
#COPY arc_rsa /root/.ssh/id_rsa

# Copy entire project directory
COPY . /usr/ketttle

# Expose internal docker container port
EXPOSE 3000

# Run command
CMD [ "npm", "start" ]
