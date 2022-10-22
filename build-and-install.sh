#!/usr/bin/env bash

set -e

EXT_VERSION=$(cat package.json | jq .version | tr -d '"')
vsce package
echo -e '\nPackaged\n\n'
code --install-extension openplanet-angelscript-$EXT_VERSION.vsix
echo -e '\nInstalled in WSL\n\n'
powershell.exe -Command "code --install-extension $(wslpath -w ./openplanet-angelscript-$EXT_VERSION.vsix)"
echo -e '\nInstalled in Windows\n\n'
echo -e 'Done'
