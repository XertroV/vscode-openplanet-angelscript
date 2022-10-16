#!/usr/bin/env bash

set -e

EXT_VERSION=$(cat package.json | jq .version | tr -d '"')
vsce package
code --install-extension openplanet-angelscript-$EXT_VERSION.vsix
powershell.exe -Command "code --install-extension $(wslpath -w ./openplanet-angelscript-$EXT_VERSION.vsix)"
echo '\n\nDone -- built an installed in WSL and Windows'
