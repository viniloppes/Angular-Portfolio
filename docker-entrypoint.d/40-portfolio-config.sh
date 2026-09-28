#!/bin/sh
set -eu

: "${API_BASE_URL:?Set API_BASE_URL to the public API origin}"
: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY to the public key}"

envsubst '${API_BASE_URL} ${SUPABASE_URL} ${SUPABASE_ANON_KEY}' \
  < /opt/portfolio-config.js.template \
  > /usr/share/nginx/html/portfolio-config.js
