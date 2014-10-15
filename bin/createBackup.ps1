# Create full site backup
"Creating Full Site Backup"

cd "D:\home\site\"
If (Test-Path ./wwwroot-backup/){
    "Removing old backup"
    Remove-Item -Path ./wwwroot-backup -Recurse
}

Copy-Item D:\home\site\wwwroot -Destination D:\home\site\wwwroot-backup -Recurse
If (Test-Path ./wwwroot-backup/){
    "All done"
}
Else {
    "WARNING Backup not created"
}