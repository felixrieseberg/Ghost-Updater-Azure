# Remove full site backup
"Removing Full Site Backup"

cd "D:\home\site\"
If (Test-Path ./wwwroot-backup/){
    Remove-Item -Path ./wwwroot-backup -Recurse
}
"All done"