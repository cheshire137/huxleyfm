#!/usr/bin/env bash
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
	npm run build
	(cd dist; zip -r HuxleyFM-$TRAVIS_TAG-darwin-x64.zip HuxleyFM-darwin-x64)
elif [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
	npm run-script build-linux
	(cd dist; tar zcvf HuxleyFM-$TRAVIS_TAG-linux-ia32.tar.gz HuxleyFM-linux-ia32)
	(cd dist; tar zcvf HuxleyFM-$TRAVIS_TAG-linux-x64.tar.gz HuxleyFM-linux-x64)

	# also try windows!
	npm run-script build-windows-wine
	(cd dist; zip -r HuxleyFM-$TRAVIS_TAG-win32-ia32.zip HuxleyFM-win32-ia32)
	(cd dist; zip -r HuxleyFM-$TRAVIS_TAG-win32-x64.zip HuxleyFM-win32-x64)
fi
