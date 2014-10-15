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
"Creating required elements"
New-Item -ItemType directory -Path D:\home\site\wwwroot\content\apps -ErrorAction SilentlyContinue

# Cleanup NPM modules
cd "D:\home\site\wwwroot"
"Running npm install (production)"
Stop-Process -processname node
npm install --production

# Install node-sqlite3 bindings for both the 32 and 64-bit Windows architecture.
# node-sqlite3 will build the bindings using the system architecture and version of node that you're running the install

# Force install of the 32-bit version, then move the lib to temporary location
Write-Output "Installing SQLite3 x32 Module"
& npm install sqlite3 --target_arch=ia32
Move-Item ".\node_modules\sqlite3\lib\binding\node-v11-win32-ia32\" -Destination ".\temp"

# Force install of the 64-bit version, then copy 32-bit back
Write-Output "Installing SQLite3 x64 Module"
& npm install sqlite3 --target_arch=x64
Move-Item ".\temp" -Destination ".\node_modules\sqlite3\lib\binding\node-v11-win32-ia32\"

# Cleanup
"We're done, cleaning up!"
cd "D:\home\site\temp\"
"Removing temp Ghost folder"
Remove-Item -Path ./latest -Recurse
"Removing temp Ghost zip"
Remove-Item -Path ./ghost.zip

"All done"