# Use the official Node.js image as a base
FROM node:20


# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of your application code
COPY . .

# Compile TypeScript code
RUN tsc

# Expose port 8080 for the application
EXPOSE 8080

# Command to run your application
CMD ["node", "dist/index.js"]
