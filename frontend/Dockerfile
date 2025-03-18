FROM node:18-alpine

WORKDIR /app

# Only copy package.json first (not package-lock.json)
COPY package.json ./

# Run npm install to generate package-lock.json
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 3000

CMD ["npm", "start"]