#!/usr/bin/env bash

set -euo pipefail

npm install netlify-cli -g
netlify deploy \
    $([[ "$TRAVIS_BRANCH" = master ]] && echo --prod) \
    --site "$NETLIFY_SITE_ID" \
    --auth "$NETLIFY_ACCESS_TOKEN" \
    --message "${TRAVIS_BRANCH} @${TRAVIS_COMMIT}: ${TRAVIS_COMMIT_MESSAGE}" \
    --dir dist
