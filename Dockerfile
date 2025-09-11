# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Compile the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Define production environment variables
ENV NODE_ENV=production

WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Command to start the application
CMD ["node", "dist/main"]
