# Restore full site backup
"Restoring Full Site Backup"

cd "D:\home\site\"
If (Test-Path ./wwwroot-backup/) {
    Remove-Item -Path ./wwwroot -Recurse
    Rename-Item D:\home\site\wwwroot-backup wwwroot
}
Else {
    "WARNING No backup found"
}
"All done"