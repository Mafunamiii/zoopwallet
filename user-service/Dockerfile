# Use Node.js 20 as the base image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of the application code
COPY . .
COPY .env .


# Build the TypeScript code
RUN tsc

# Expose the application port
EXPOSE 8080

# Command to run the application
CMD ["node", "dist/index.js"]