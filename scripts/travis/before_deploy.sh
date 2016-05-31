#!/usr/bin/env bash
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
	npm run build
	(cd dist; zip -r HuxleyFM-$TRAVIS_TAG-os-x-darwin-x64.zip HuxleyFM-os-x-darwin-x64 )
elif [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
	npm run-script build-linux
	(cd dist; tar zcvf HuxleyFM-$TRAVIS_TAG-linux-ia32.tar.gz HuxleyFM-linux-ia32)
	(cd dist; tar zcvf HuxleyFM-$TRAVIS_TAG-linux-x64.tar.gz HuxleyFM-linux-x64)
elif [[ "$TRAVIS_OS_NAME" == "windows" ]]; then
	echo 'TODO'
fi

#export OSX_RELEASE=$(ls dist/HuxleyFM-*-os-x-darwin-x64.zip)
#export LINUX_ia32=$(ls dist/HuxleyFM-*-linux-ia32.tar.gz)
#export LINUX_x64=$(ls dist/HuxleyFM-*-linux-x64.tar.gz)
