# Changelog

All notable changes to this project will be documented in this file.

## 1.4.0

- [NEW] !!! TV defaults now to external accessories - #298 !!!
- [FIX] prevent crash if no hubs found on auto discovery #300
- [NEW] test power On / Off outside of Power control group for custom devices - #294
- [NEW] General Volume Up and Down Accessories #296 - thx to @jplwoodward
- [NEW] Add support ot github sponsors - thank you :) - #304

## 1.3.12

- [FIX?] Removing access control by default to try to resolve #280

## 1.3.11

- [FIX] No longer existing platform cannot be removed #275

## 1.3.10

- [FIX] since Update 1.3.9 no iOS Remote button works except volume #271

## 1.3.9

- [FIX] crash at reboot after last update : you might need to restart twice for everything to work again if you upgrade from 1.3.8 - #269

## 1.3.8

- [FIX] numberOfCommands for volume broken - #261
- [FIX] typo in config.schema for HomeBridge UI-X - PR #267
- [NEW] adding AcessControlManagement to TV Accessories / Bumping homebridge Version

## 1.3.7

- [FIX] change node prerequisite to LTS version (10.20.0 at least)

## 1.3.6

- [FIX] changelog and dep error

## 1.3.5

**It seems from my test that those changes are not breaking the cached accessories, but you might need to clean your cache in case of problems. Concerning SerialNumber, it should be updated after a restart, but could be a problem also. If that is the case, you will need to clean cache.**

- [FIX] Change pluginIdentifier in platform registration to be compatible with 1.0 of Homebridge (sorry guys, was not clean on this before ...)
- [FIX] Unique serialnumber for accessories to avoid Eve App problems #249

## 1.3.4

- [FIX] Multiple Hubs : autoDiscovery not working #245 special thanks to donavanbecker(https://github.com/donavanbecker) for testing

## 1.3.3

- [FIX] Link volume switch/ mute to tv accessory #244

## 1.3.2

- [NEW] Link volume switch/ mute to tv accessory #244

## 1.3.1

- [FIX] Mute command not working (regression from 1.3.0)

## 1.3.0

- [NEW] Add capacity to send multiple commands at once with remoteOverrideCommandsList #236
- [NEW] General volume control as a slider #239
- [NEW] Dynamic Discovery of Hubs #238

## 1.2.7

- [FIX] Removing added log for #217

## 1.2.6

- [FIX] Still trying to solve Harmony Plugin causes Hoobs-Homebridge to crash #217

## 1.2.5

- [FIX] Limiting number of sockets event in case of multiple refresh with no response from the hub or slight delay (network problems)

## 1.2.4

- [NEW] Improve handling of false value in config #219

## 1.2.3

- [FIX] Trying to fix by removing unecessary dep Harmony Plugin causes Hoobs-Homebridge to crash #217

## 1.2.2

- [FIX] "View TV Settings" causes HomeBridge crash #207 (if no current input)
- [FIX] Input set in a scene is ignored, and main activity is turned on #157

## 1.2.1

- [FIX] "showTurnOffActivity" wrong config via ConfigUI-X #203

## 1.2.0

- [NEW] Supports config UI X configuration interface. **Be aware that remoteOverrideCommandsList is not in the same format anymore f you edit your config through the interface.**

## 1.1.1

- [FIX] error if an activity is named "TV" in some circumstances #195

## 1.1.0

- [NEW] handle config changes by removing activities / services #167
- [NEW] handling 2 tv accessories with only one hub (by separating activities) #178
- [NEW] general mute switch #166
- [NEW] activities with no TV (audio use case) #181
- [FIX] showTurnOffActivity = False not working if was set to true before #183

## 1.0.7

- [FIX] reverting to 1.0.4 code

## 1.0.6

- [FIX] reverting a change

## 1.0.5

- [FIX] trying to better handle some problems with clean cache / name caching

## 1.0.4

- [FIX] sequencesToPublishAsAccessoriesSwitch switches don't do anything #165

## 1.0.3

- [FIX] changing plarform name is not supported after first launch #162

## 1.0.2

- [FIX] harmony.end is not a function #161

## 1.0.1

- [FIX] Input set in a scene is ignored, and main activity is turned on #157

## 1.0.0

- [NEW] Act as a dynamic platform
- [NEW] Option to set custom default name for device switches
- [BREAKING] complete subplatofrm logic / config change and renaming of some parameters - see README MIGRATION for details

## 0.7.0

- [NEW] option for list of activities as switches / inputs #116 - SEE README activitiesToPublishAsInputForTVMode & activitiesToPublishAsAccessoriesSwitch
- [NEW] option for Control volume in tv mode with a given number of IR commands #115 - SEE README numberOfCommandsSentForVolumeControl

## 0.6.1

- [NEW] swithcing to @lopelex 1.0.9

## 0.6.0

- [NEW] support for Exposing Home Control buttons #67
- [BUG] ReferenceError #110

## 0.5.5

- [BUG] - showTurnOffActivity doesn’t work properly when inverterted #107

## 0.5.4

- [BUG] - Devices are not published if publishDevicesAsIndividualAccessories is set to false #106

## 0.5.3

- [NEW] handle skipedIfSameStateActivities for POWER OFF in TV mode #104 - Just add "PowerOff" to the skipedIfSameStateActivities.

## 0.5.2

- [FIX] ERROR - TVMODE - Override of a command throw an error if there is no device published in devicesToPublishAsAccessoriesSwitch #99
- [FIX] Complete homebridge is unresponsive if 1 hub is not reachable #101 . I pushed a pull request to harmony api in order to have slower timeout, but still should allready be better.
- [NEW] add “Menu” button to iOS remote widget #102

## 0.5.1

- [FIX] The prout bug ... sorry guys !!!

## 0.5.0

- [NEW] Tvmode : option to set specific commands on remote widget buttons #84 - **SEE README FOR SYNTAX**

## 0.4.92

- [FIX] Sequences are gone since 0.4.8 #93

## 0.4.91

- [FIX] ERROR - activityCommand : TypeError: Cannot read property 'debug' of undefined

## 0.4.9

- [FIX] #89 This callback function has already been called by someone else when `publishDevicesAsIndividualAccessories` is set to true (default value :( sorry ! )

## 0.4.8

- [NEW] Input hiding handling #85
- [NEW] huge refactoring to enhance code quality (I hope there won't be too much bugs ! )
- [NEW] stateless / inverted option for showTurnOffActivity #86
- [FIX] Play / pause beahvior #76
- [FIX] Back button not always handled depending on harmony configuration #83

## 0.4.7

- [NEW] supports new option playPauseBehavior

## 0.4.6

- [NEW] Supports Sequences. #69

## 0.4.5

- [FIX] TVPlatform mode : name of device/inputs lost if modified at homebridge restart #68 (in docker env - using persist folder now)
- [NEW] node.js minimum requirement updated to 7.6.0 (use of async / await)

## 0.4.4

- [NEW] macro mode : you can specify the delay to wait after each command by adding a "|250" string for exemple : "MyDevice;Up|250;Down|500"
- [FIX] TVPlatform mode : name of device/inputs lost if modified at homebridge restart #68

## 0.4.3

- [FIX] TV Mode borken #66
- [FIX] move timer for activity macro to 350ms

## 0.4.2

- [FIX] move to latest version of @lopelex lib for compatibility with latest hub firmware 4.15.250 #64
- [NEW] handle macro for devices switch . Use multiple commands separate by a ";" #63
- [NEW] printing commands of your devices at startup in log (no debug needed)

## 0.4.1

- [NEW] you can specify custom command for devices switches
- [FIX] error if you set both options `publishDevicesAsIndividualAccessories` and `publishActivitiesAsIndividualAccessories` to false

## 0.4.0

- [NEW] `devicesToPublishAsAccessoriesSwitch` option (#15)

## 0.3.9

- [FIX] connection lost after a while : #56 and possible problem on different networks (still need confirmation #57)

## 0.3.8

- [FIX] Moving back to official harmony-websocket plugin from @lopelex since pull request was mergerd and published

## 0.3.7

- [FIX] TV-Mode : switching to pressrelease command for commands.

## 0.3.6

- [FIX] TV-Mode : fixing Error: WebSocket closed with reason: Connection dropped by remote peer. (1006).

## 0.3.5

- [FIX] TV-Mode : commands are not sent anymore

## 0.3.4

- [FIX] TV-Mode : commands might be sent multiple times : switching to a forked version of harmony-websocket

## 0.3.3

- [FIX] TV-Mode : commands might be sent multiple times

## 0.3.2

- [FIX] disconnect issues #55

## 0.3.1

- [FIX] tiny fixes / refactoring

## 0.3.0

- [NEW] moving to @lopelex harmony-websocket lib
- [NEW] no more timer for refresh (using statedigest only)

## 0.2.7

- [FIX] bugs due to refresh through stateDigest - #50

## 0.2.6

- [FIX] background refresh was stopping after 1 minute

## 0.2.5

- [FIX] bugs and refactoring

## 0.2.4

- [FIX] TV MODE - crash on button /volume action #50
- [NEW] some code refactoring between two modes (I hope nothing is broken :)

## 0.2.3

- [NEW] TV MODE - restoring `SkipedIfSameStateActivities` options #46

## 0.2.2

- [FIX] TV MODE - potential issue with sound control
- [FIX] TV MODE - potential issue with inputs lost (to be confirmed)
- [NEW] refreshMode through stateDigest - option refreshByHub - defaults true #48

## 0.2.1

- [FIX] TV MODE - remote controls are sent multiple times #43
- [FIX] TV MODE - using the remote switch back to main activity #42
- [FIX] TV MODE - goes to main input when run through automation #45
- [FIX] TV MODE - cannot pick inputs at first launch #44 (not reproduced sinces other changes)

## 0.2.0

- [FIX] crash when using off switch in accessory #36
- [NEW] beta mode for TV - IOS 12.2

## 0.1.7

- [FIX] Homebridge Crash when turning off activity #36 (`publishActivitiesAsIndividualAccessories` mode)

## 0.1.6

- [FIX] Better default naming #33 . You might loose your renaming / room / inclusion in automation :(

## 0.1.5

- [FIX] default value for `publishActivitiesAsIndividualAccessories` (true)

## 0.1.4

- [NEW] option for using old way with one accessory for all activities #29
- [FIX] add some delay before launching background refresh after successfull activity command since if `refreshTimer` is low the current activity get back to the wrong one

## 0.1.3

- [FIX] fixing error in case of operation in progress (callback undefined in on_Timeout) #32
- [FIX] fixing error in case of multiple hubs #28

## 0.1.2

- [FIX] power off activity was able to be switched off when on.

## 0.1.1

- [FIX] crash after launching an activity
- [FIX] other activities not updated when activating one

## 0.1.0

- [NEW] each activity is published as an accessory - You might need to empty your cache folder .

## 0.0.9

- [NEW] option to add automatically all activities to `skipedIfSameStateActivities`
- [FIX] `skipedIfSameStateActivities` propery no more mandatory
- [FIX] potential conflict with other plugins

## 0.0.8

- [NEW] add `skipedIfSameStateActivities` config list (see fields descrption).
- [UPDATE] less Hub calls for currentActivity (refreshed only if it is not older than 2 secondes)
- [UPDATE] some code refactoring
- [UPDATE] `turnOffActivityName` option **REMOVED** (switch can be renamed in homekit directly)

## 0.0.7

- [NEW] refreshTimer option (for automation purpose)
- [NEW] ip of hub is used as serial number of the device.
- [UPDATE] logs are now less verbose, ACTIVATE -D switch on homebridge if you have any trouble in order to get full logs

## 0.0.6

- [BREAKING] `platform` was renamed to `HarmonyHubWebSocket` to avoid conflicts with previous plugins commonly used.
- [NEW] introduces retry mechanism if error codes 202 / 100 returns by hub while starting an activity
- [UPDATE] updates node dependency to 6.0.0 and homebridge to 0.4.21

## 0.0.3

- [BREAKING] `TurnOffActivityName` was renamed to `turnOffActivityName`.
