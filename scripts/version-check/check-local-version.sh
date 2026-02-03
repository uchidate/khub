#!/bin/bash
# check-local-version.sh

echo "=== VERSÃO LOCAL ==="
echo ""
echo "📦 Package.json:"
cat v1/package.json | grep '"version"'
echo ""
echo "🌿 Git branch atual:"
git branch --show-current
echo ""
echo "📝 Último commit:"
git log -1 --oneline
echo ""
echo "🔄 Git status:"
git status --short
