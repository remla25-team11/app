#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status.

# Default URL if APP_SERVICE_URL is not set (though it should be by Kubernetes)
DEFAULT_APP_SERVICE_URL="http://localhost:5000" # Fallback, should not be used in K8s
TARGET_CONFIG_JS="/usr/share/nginx/html/config.js"

echo "Nginx Entrypoint: Starting up..."
echo "Nginx Entrypoint: APP_SERVICE_URL from environment: '${APP_SERVICE_URL}'"

if [ -z "${APP_SERVICE_URL}" ]; then
  echo "Nginx Entrypoint: Warning! APP_SERVICE_URL is not set. Using default: ${DEFAULT_APP_SERVICE_URL}"
  APP_SERVICE_URL_TO_USE="${DEFAULT_APP_SERVICE_URL}"
else
  APP_SERVICE_URL_TO_USE="${APP_SERVICE_URL}"
fi

if [ ! -f "${TARGET_CONFIG_JS}" ]; then
  echo "Nginx Entrypoint: Error! ${TARGET_CONFIG_JS} not found. Cannot configure backend URL."
  exit 1
fi

echo "Nginx Entrypoint: Original content of ${TARGET_CONFIG_JS}:"
cat "${TARGET_CONFIG_JS}"

# Use a temporary file for sed to avoid issues with in-place editing on some systems/versions
TMP_CONFIG_JS=$(mktemp)

# Replace the placeholder. Using '|' as delimiter for sed.
# Ensure __APP_SERVICE_URL__ is exactly how it appears in your config.js
sed "s|__APP_SERVICE_URL__|${APP_SERVICE_URL_TO_USE}|g" "${TARGET_CONFIG_JS}" > "${TMP_CONFIG_JS}"
mv "${TMP_CONFIG_JS}" "${TARGET_CONFIG_JS}"

echo "Nginx Entrypoint: Modified content of ${TARGET_CONFIG_JS}:"
cat "${TARGET_CONFIG_JS}"

echo "Nginx Entrypoint: Starting Nginx..."
exec nginx -g 'daemon off;'