# Use an official Node.js runtime as the base image
FROM node:18.17

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the client port
EXPOSE 3000

# Set the default command to run the application
CMD ["npm", "run", "dev"]
