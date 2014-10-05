# Ghost Updater for Microsoft Azure [WIP]
This is tiny tool allows the automatic upgrade of Ghost running in Azure Websites. 

## What's happening inside
I boiled the update of Ghost down to a simple three-step-program.
- Upload the latest release to your website
- Deploying an upgrade script, which will do all the critical hard work right on the machine running your website
- Triggering said script, which will unzip the package, update Ghost files and update the Node modules.