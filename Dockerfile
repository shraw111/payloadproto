# AI Content Studio (prototype). One container: Next.js with Payload inside, SQLite on a mounted volume.
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DEMO_STAGE=after

# Dev dependencies stay: the first-boot seed runs through tsx.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --include=dev

COPY . .

# The build only needs a throwaway database path and secret; real values come from the platform at runtime.
RUN DATABASE_URI=file:/tmp/build.db PAYLOAD_SECRET=build-time-only npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
