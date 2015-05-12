---
title: 'Backup everything – my backup setup'
date: '2011-05-01 14:36'
tags:
  - Backup
  - Dropbox
  - 'OS X'
  - 'Super Duper'
  - 'Time Machine'
category: Security
---

**Backups are important.** Really, really important. They say if you don’t have two or more copies of a file, the file doesn’t exist. I had no backups whatsoever until a couple of weeks ago, when I thought to myself: _“What would I do if my hard drive breaks? Would I do well losing years and years of work?”_. Of course not! I really had to start securing and backing up my data, and what follows is a quick writeup on the process.

## Locally

### Time Machine
This is the first obvious backup solution in OS X for the Average Joe. Time Machine works in the background and does everything for you. No fuzz or fine tuning. I’ve got a 1TB [Iomega UltraMax Plus Desktop](http://go.iomega.com/en/products/external-hard-drive-desktop/ultramax-minimax/ultramax-plus/?partner=4740) external hard drive in RAID1 mode (mirrored, that is) for complete backups of my files (no system files). Since Time Machine do most of the work (and doing it good so far) I couldn’t motivate getting another kind of backup software. It works seamlessly, and since the drive consists of two mirrored internal hard drives, all data is actually stored in two places for extra redundancy. Normally I don’t like putting an automated application in control over the backup of my precious files, but Time Machine “feels” good. Time Machine doesn’t only work as a safety net in the case of emergency – it’s great for simply archiving your files. You’re able to roll back and forth if you realize you accidently deleted that particular file earlier that day/week/month.
### Super Duper
While Time Machine is great and all, it’s actually just for everyday backup of your files. What if you would like a complete, bootable copy of your entire hard drive? This is where Super Duper will help you. It’s a nifty app which lets you copy the contents of your hard drive to an external drive (ideally). I find it calming to know that I have a safety net if something would happen to my computer; like physical damage, theft or something else. Then it’s just a matter of booting from that Super Duper copy. Nifty.
## Offsite backup
What if my house would be burnt down by fire, and my precious files would be lost on the external backup drive? (which I couldn’t save from the flames). What if a burglary would leave me with no computer or drive? Offiste, over-the-air backup comes to the resque. On the courtesy of [Joacim Melin](http://macpro.se) I have the privilege of using [CrashPlan Pro](http://crashplan.com). The Crashplan client constantly copies all new and updated files over the internet to a Crashplan server, securely storing my data offsite if something would happen.
## Dropbox
  [Dropbox](http://dropbox.com) is a wonderful service, giving you free space to store small and large files in the cloud, and doing a great job syncing them between devices. I use Dropbox to store important files, such as text files and assets, which I might want to access from my iPhone on the go, or even a completely different computer. As long as I’ve got an internet connection I’m assured that the file I’m working with is saved and synced “up to the cloud”. An interesting solution by application developers is to store libraries and configuration files in the user’s Dropbox, making syncronization between devices seamless ( [1Password](http://agilewebsolutions.com/onepassword) is a great example: my keychain library file is synced between the application on my Mac as well as on my iPhone – no hassle with tedious typing or duplicated entries). Also, Dropbox offers basic versioning for your files, with the ability to rollback changes. Great for backup.
## More
When writing this post, I was inspired by [this post by Shawn Blanc on backups in OS X](http://shawnblanc.net/2008/02/bulletproof-backups/) as well as [Frank Chimero’s thorough writeup on his backup setup](http://blog.frankchimero.com/post/2799470127/the-setup).
