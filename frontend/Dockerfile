# 1. Use a Node version compatible with Vite 7
FROM node:22-alpine

# 2. Set the working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application code
COPY . .

# 6. Expose the port the app runs on
EXPOSE 5173

# 7. Start the application
CMD ["npm", "run", "dev", "--", "--host"]
