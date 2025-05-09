FROM nginx:alpine
ARG APP_SERVICE_URL

COPY . /usr/share/nginx/html
RUN sed -i "s|__APP_SERVICE_URL__|${APP_SERVICE_URL}|g" /usr/share/nginx/html/config.js

EXPOSE 80
