FROM node:22-bookworm-slim AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . ./
RUN npm run build -- --configuration production

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY portfolio-config.js.template /opt/portfolio-config.js.template
COPY docker-entrypoint.d/40-portfolio-config.sh /docker-entrypoint.d/40-portfolio-config.sh
COPY --from=build /src/dist/portfolio/browser/ /usr/share/nginx/html/
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-portfolio-config.sh \
    && chmod +x /docker-entrypoint.d/40-portfolio-config.sh
EXPOSE 80
