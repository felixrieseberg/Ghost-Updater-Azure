# Unzip uploaded ghost.zip
"Unzipping Ghost to /site/temp/latest"
cd "D:\home\site\temp"
If (Test-Path ./latest/){
    Remove-Item -Path ./latest/* -Recurse
}
unzip -d ./latest/ ghost.zip

# Delete index.js, package.json, ./core and ./content/themes/casper/*
cd "D:\home\site\wwwroot"
"Removing core"
Remove-Item -Path ./core/* -Recurse
"Removing Caspter theme"
Remove-Item -Path ./content/themes/casper/* -Recurse
"Removing index.js"
Remove-Item -Path index.js
"Removing package.json"
Remove-Item -Path package.json

# Move index.js, package.json, ./core and ./content/themes/casper/*
cd "D:\home\site\temp\latest"
"Moving core"
Move-Item -Path ./core/* -Destination D:\home\site\wwwroot\core\
"Moving Casper"
Move-Item -Path ./content/themes/casper/* -Destination D:\home\site\wwwroot\content\themes\casper\
"Moving index.js"
Move-Item -Path ./index.js -Destination D:\home\site\wwwroot\
"Moving package.json"
Move-Item -Path ./package.json -Destination D:\home\site\wwwroot\

# Cleanup NPM modules
"Removing node modules"
cd "D:\home\site\wwwroot"
Remove-Item -Path ./node-modules/* -Recurse
"Running npm install (production)"
npm install --production

# Cleanup
"We're done, cleaning up!"
cd "D:\home\site\temp\"
"Removing temp Ghost folder"
Remove-Item -Path ./latest -Recurse
"Removing temp Ghost zip"
Remove-Item -Path ./ghost.zip