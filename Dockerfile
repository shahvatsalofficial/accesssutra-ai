# Development-only example. Not a production-hardened deployment.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY packages ./packages
COPY examples/reports/demo ./examples/reports/demo
USER node
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node","packages/cli/accesssutra.mjs","serve","--dir","examples/reports/demo","--port","8787"]
