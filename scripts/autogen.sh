#!/bin/sh

# Download libs
apk add --no-cache curl jq
npm install --save-dev xml-js

# Download spec from source of truth
curl https://raw.githubusercontent.com/ietf-wg-cellar/matroska-specification/master/ebml_matroska.xml -o ebml_matroska.xml

# Generate normalised schema
node convert.js | jq . > converted.json
node baseline.js | jq . > baselined.json

# Compare
#diff --color=always -u baselined.json converted.json | less -r
