# In app/Dockerfile

FROM nginx:alpine

# The build context is the project root, so specify the full path to the files
COPY app/index.html /usr/share/nginx/html/index.html
COPY app/styles.css /usr/share/nginx/html/styles.css
COPY app/script.js /usr/share/nginx/html/script.js
COPY app/config.js /usr/share/nginx/html/config.js
COPY app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run the script on container start
CMD ["/entrypoint.sh"]
