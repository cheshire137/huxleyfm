#!/usr/bin/env bash
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
  if [[ "$WINE" == "true" ]]; then
  	npm run-script build-osx
  	(cd dist; zip -r HuxleyFM-$TRAVIS_TAG-darwin-x64.zip HuxleyFM-darwin-x64)
  fi
elif [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  if [[ "$WINE" == "true" ]]; then
    npm run-script build-windows-wine
    (cd dist; zip -r HuxleyFM-$TRAVIS_TAG-win32-ia32.zip HuxleyFM-win32-ia32)
    (cd dist; zip -r HuxleyFM-$TRAVIS_TAG-win32-x64.zip HuxleyFM-win32-x64)
  else
    npm run-script build-linux
    (cd dist; tar zcvf HuxleyFM-$TRAVIS_TAG-linux-ia32.tar.gz HuxleyFM-linux-ia32)
    (cd dist; tar zcvf HuxleyFM-$TRAVIS_TAG-linux-x64.tar.gz HuxleyFM-linux-x64)
  fi
fi
