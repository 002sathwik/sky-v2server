FROM ubuntu:focal

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git

# Install Node.js (version 20)
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get upgrade -y

# Create and set working directory
WORKDIR /home/app

# Copy package.json and package-lock.json for npm install
COPY package*.json ./

# Install npm dependencies (including TypeScript)
RUN npm install

# Copy the remaining files (including TypeScript source files)
COPY main.sh main.sh
COPY script.ts script.ts
COPY tsconfig.json tsconfig.json

# Install TypeScript globally
RUN npm install -g typescript

# Compile TypeScript into JavaScript using the tsconfig.json
RUN tsc

# Make script and main.sh executable
RUN chmod +x main.sh
RUN chmod +x ./dist/script.js

# Define the entry point script
ENTRYPOINT [ "/home/app/main.sh" ]
