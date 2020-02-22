#!/bin/bash

npm update

VERSION=$(node --eval "console.log(require('./package.json').version);")
ME=$(node --eval "console.log(require('./package.json').name);")

npm test || exit 1

echo "Ready to publish ${ME} version $VERSION."
echo "Has the version number been bumped?"
read -n1 -r -p "Press Ctrl+C to cancel, or any other key to continue." key

git checkout -b build

export NODE_ENV=release

npm run-script build

echo "Creating git tag v$VERSION..."

git add dist/${ME}-src.js dist/${ME}.js dist/${ME}-src.esm.js dist/${ME}-src.js.map dist/${ME}.js.map dist/${ME}-src.esm.js.map -f

git commit -m "v$VERSION"

git tag v$VERSION -f
git push --tags -f

echo "Uploading to NPM..."

npm publish

git checkout master
git branch -D build

echo "All done."
echo "Remember to run 'npm run-script integrity' and then commit the changes to the master branch, in order to update the website."
