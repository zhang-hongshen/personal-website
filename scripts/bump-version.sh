#!/bin/sh
# Stamps a new ?v= on every page's site.css / site.js link so browsers fetch the
# new files after a deploy (site.js passes the same version on to locales/*.json).
# Run before committing changes to common/ or locales/.
set -e
cd "$(dirname "$0")/.."
version=$(date +%Y%m%d%H%M)
find . -name '*.html' -not -path './node_modules/*' | while read -r f; do
    sed -i '' -E "s#(common/site\.(css|js))(\?v=[0-9]+)?\"#\1?v=$version\"#g" "$f"
done
echo "version $version"
