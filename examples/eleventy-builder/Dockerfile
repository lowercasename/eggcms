FROM node:20-alpine
WORKDIR /app/site
COPY server.js /app/server.js
# Install site dependencies on first run, then start listener
CMD sh -c "npm install --production 2>/dev/null; node /app/server.js"
