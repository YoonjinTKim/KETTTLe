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

# Copy entire project directory
COPY . /usr/ketttle

# Expose internal docker container port
EXPOSE 3000

# Run command
CMD [ "npm", "start" ]