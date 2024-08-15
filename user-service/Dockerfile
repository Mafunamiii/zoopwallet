# Use Node.js 20 as the base image
FROM node:20

WORKDIR /src

# Copy the package.json and package-lock.json files
COPY user-service/package*.json ./

# Install dependencies including development dependencies (TypeScript)
RUN npm install

# Copy the application code
COPY user-service/src /src
COPY ../shared /src/shared

# Build the TypeScript code
RUN npx tsc

# Expose the application port
EXPOSE 8080

# Command to run the application
CMD ["node", "dist/index.js"]
