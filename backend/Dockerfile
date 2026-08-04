FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy source code
COPY . .

# Hugging Face Spaces uses port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
