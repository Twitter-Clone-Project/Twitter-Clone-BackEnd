FROM node

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY . .

# Change Windows Command to Linux Command
RUN sed -i 's/(SET NODE_ENV=production)  & node server.js/NODE_ENV=production node server.js/' package.json

# Install app dependencies
RUN npm install

# Expose port 2023 (the port your app is running on)
EXPOSE 2023

# Start the app using the full path to npm
CMD npm run start:prod
