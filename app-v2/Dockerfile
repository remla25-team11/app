# FROM nginx:alpine
# ARG APP_SERVICE_URL

# COPY . /usr/share/nginx/html
# RUN sed -i "s|__APP_SERVICE_URL__|${APP_SERVICE_URL}|g" /usr/share/nginx/html/config.js

# EXPOSE 80

FROM nginx:alpine

# Copy frontend files into Nginx’s web root
COPY . /usr/share/nginx/html

# Copy entrypoint script into container
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run the script on container start
CMD ["/entrypoint.sh"]
