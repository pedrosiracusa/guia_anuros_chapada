#! /bin/sh

# A useful script to download the latest version of bootstrap and jquery

rm -rf node_modules package-lock.json
mkdir node_modules
npm install bootstrap@5 jquery@3 bootstrap-icons howler

rm -rf _sass/bootstrap
mkdir -p _sass/bootstrap
cp -r node_modules/bootstrap/scss/* _sass/bootstrap
touch _sass/bootstrap/__DO_NOT_MODIFY

rm -rf assets/javascript/bootstrap
mkdir -p assets/javascript/bootstrap
cp node_modules/bootstrap/dist/js/bootstrap.bundle.min.* assets/javascript/bootstrap/
cp node_modules/jquery/dist/jquery.min.* assets/javascript/bootstrap/
touch assets/javascript/bootstrap/__DO_NOT_MODIFY

rm -rf assets/bootstrap-icons
cp -r node_modules/bootstrap-icons assets/bootstrap-icons
touch assets/bootstrap-icons/__DO_NOT_MODIFY

rm -rf assets/javascript/howler
cp -r node_modules/howler/dist assets/javascript/howler
touch assets/javascript/howler/__DO_NOT_MODIFY