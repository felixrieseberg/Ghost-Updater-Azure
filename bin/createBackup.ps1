# Create full site backup

cd "D:\home\site\"
If (Test-Path ./wwwroot-backup/){
    "Removing old backup"
    Remove-Item -Path ./wwwroot-backup -Recurse
}

"Creating Full Site Backup"
Copy-Item D:\home\site\wwwroot -Destination D:\home\site\wwwroot-backup -Recurse
If (Test-Path ./wwwroot-backup/){
    "All done"
}
Else {
    "WARNING Backup not created"
}