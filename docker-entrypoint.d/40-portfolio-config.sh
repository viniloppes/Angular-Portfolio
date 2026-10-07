#!/bin/sh
set -eu

: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY to the public key}"

envsubst '${SUPABASE_URL} ${SUPABASE_ANON_KEY}' \
  < /opt/portfolio-config.js.template \
  > /usr/share/nginx/html/portfolio-config.js
