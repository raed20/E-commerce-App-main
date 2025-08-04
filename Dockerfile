# -------- Step 1: Build Angular App (SSR) --------
FROM node:18-alpine AS build

WORKDIR /app

# Install essential package
RUN apk add --no-cache wget

# Copy and install dependencies with retry
COPY package*.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retry-maxtimeout 60000 \
    && npm config set registry https://registry.npmjs.org/ \
    && npm install --legacy-peer-deps || \
       (sleep 15 && npm cache clean --force && npm install --legacy-peer-deps)

# Copy source and build
COPY . .
RUN npm run build

# -------- Step 2: Runtime (SSR Server) --------
FROM node:18-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001

# Copy only what's needed
COPY package*.json ./
COPY --from=build /app/front/shopfer ./dist


# Install production dependencies only
RUN npm config set registry https://registry.npmjs.org/ \
    && npm install --production --legacy-peer-deps --no-audit --no-fund

# Clean cache and set permissions
RUN chown -R angular:nodejs /app/dist


USER angular

# Expose port and env
ENV NODE_ENV=production
ENV PORT=4200
EXPOSE 4200

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:4200/ || exit 1

# Start SSR server
CMD ["node", "dist/server/server.mjs"]
