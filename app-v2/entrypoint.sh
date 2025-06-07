#!/bin/sh

# Replace the placeholder with the runtime environment variable
sed -i "s|__APP_SERVICE_URL__|${APP_SERVICE_URL}|g" /usr/share/nginx/html/config.js

# Start Nginx
exec nginx -g "daemon off;"
