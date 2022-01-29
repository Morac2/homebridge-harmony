var Service, Characteristic, Accessory, AccessControlManagement, AccessControlEvent;
const HarmonyBase = require('./harmonyBase').HarmonyBase;
const HarmonyConst = require('./harmonyConst');
const HarmonyTools = require('./harmonyTools.js');
const HarmonyAsTVKeysTools = require('./harmonyAsTVKeysTools.js');
const fs = require('fs');

module.exports = {
  HarmonySubPlatform: HarmonySubPlatform,
};

function HarmonySubPlatform(log, config, api, mainPlatform) {
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  Accessory = api.hap.Accessory;
  AccessControlManagement = api.hap.AccessControlManagement;
  AccessControlEvent = api.hap.AccessControlEvent;

  this.api = api;
  this.mainPlatform = mainPlatform;
  this.harmonyBase = new HarmonyBase(api);
  this.harmonyBase.configCommonProperties(log, config, this);

  this.TVAccessory = HarmonyTools.checkParameter(config['TVAccessory'], true);

  this.sortInput = HarmonyTools.checkParameter(config['sortInput'], 0);

  this.publishGeneralMuteSwitch = HarmonyTools.checkParameter(
    config['publishGeneralMuteSwitch'],
    false
  );

  this.publishGeneralVolumeSlider = HarmonyTools.checkParameter(
    config['publishGeneralVolumeSlider'],
    false
  );

  this.publishGeneralVolumeSwitches = HarmonyTools.checkParameter(
    config['publishGeneralVolumeSwitches'],
    false
  );

  this.linkVolumeControlToTV = HarmonyTools.checkParameter(config['linkVolumeControlToTV'], false);

  this.numberOfCommandsSentForVolumeControl = HarmonyTools.checkParameter(
    config['numberOfCommandsSentForVolumeControl'],
    1
  );

  if (this.TVAccessory) {
    this.mainActivity = (this.devMode ? 'DEV' : '') + config['mainActivity'];
    this.playPauseBehavior = HarmonyTools.checkParameter(config['playPauseBehavior'], false);

    this.activitiesToPublishAsInputForTVMode = config['activitiesToPublishAsInputForTVMode'];

    this.remoteOverrideCommandsList = config['remoteOverrideCommandsList'];

    this.configureAccesscontrol = HarmonyTools.checkParameter(
      config['configureAccesscontrol'],
      false
    );

    if (Array.isArray(this.remoteOverrideCommandsList)) {
      this.log.debug('(' + this.name + ')' + 'INFO - remoteOverrideCommandsList is in new format');
      const NewRemoteOverrideCommandsList = {};
      this.remoteOverrideCommandsList.forEach((x) => {
        var commands = {};
        x.CommandsList.forEach((y) => (commands[y.CommandName] = y.NewCommand));
        NewRemoteOverrideCommandsList[x.ActivityName] = commands;
      });
      this.remoteOverrideCommandsList = NewRemoteOverrideCommandsList;
    }

    this.log.debug(
      '(' +
        this.name +
        ')' +
        'INFO - remoteOverrideCommandsList is : ' +
        JSON.stringify(this.remoteOverrideCommandsList)
    );

    if (
      !this.addAllActivitiesToSkippedIfSameStateActivitiesList &&
      !this.skippedIfSameStateActivities
    ) {
      this.skippedIfSameStateActivities = ['PowerOff'];
    }

    this.log.debug(
      '(' +
        this.name +
        ')' +
        '(' +
        this.name +
        ')' +
        'INFO - playPause option set to ' +
        this.playPauseBehavior
    );
    this.playStatus = {};
    this.volumesLevel = {};

    this.prefsDir = api.user.storagePath();
    // check if prefs directory ends with a /, if not then add it
    if (this.prefsDir.endsWith('/') === false) {
      this.prefsDir = this.prefsDir + '/';
    }

    this.savedNamesFile =
      this.prefsDir +
      'harmonyPluginNames_' +
      this.name +
      '_' +
      (this.hubIP == undefined ? this.name : this.hubIP.split('.').join(''));
    this.savedVisibilityFile =
      this.prefsDir +
      'harmonyPluginVisibility_' +
      this.name +
      '_' +
      (this.hubIP == undefined ? this.name : this.hubIP.split('.').join(''));

    this.savedNames = {};
    try {
      this.savedNames = JSON.parse(fs.readFileSync(this.savedNamesFile));
    } catch (err) {
      this.log.debug('(' + this.name + ')' + 'INFO - input names file does not exist');
    }

    this.savedVisibility = {};
    try {
      this.savedVisibility = JSON.parse(fs.readFileSync(this.savedVisibilityFile));
    } catch (err) {
      this.log.debug('(' + this.name + ')' + 'INFO - input visibility file does not exist');
    }
  }

  this.isPlatformWithSwitch = HarmonyTools.isPlatformWithSwitch(config);

  if (this.isPlatformWithSwitch) {
    this.showTurnOffActivity = HarmonyTools.checkTurnOffActivityOption(
      config['showTurnOffActivity']
    );

    this.publishSwitchActivitiesAsIndividualAccessories = HarmonyTools.checkParameter(
      config['publishSwitchActivitiesAsIndividualAccessories'],
      true
    );

    this.activitiesToPublishAsAccessoriesSwitch = config['activitiesToPublishAsAccessoriesSwitch'];

    this.switchAccessories = config['switchAccessories'];
    if (!this.switchAccessories && !this.activitiesToPublishAsAccessoriesSwitch) {
      this.activitiesToPublishAsAccessoriesSwitch = [];
    }
  }

  this._confirmedAccessories = [];
  this._confirmedServices = [];
}

HarmonySubPlatform.prototype = {
  //MAIN METHODS

  onMessage(newActivity) {
    this.refreshCurrentActivityOnSubPlatform(newActivity);
  },

  readAccessories: function (data, homedata) {
    let accessoriesToAdd = [];
    if (this.TVAccessory)
      accessoriesToAdd.push.apply(accessoriesToAdd, this.readTVAccessories(data));

    if (this.isPlatformWithSwitch)
      accessoriesToAdd.push.apply(accessoriesToAdd, this.readSwitchAccessories(data));

    this.harmonyBase.setupFoundAccessories(this, accessoriesToAdd, data, homedata);
  },

  readSwitchAccessories: function (data) {
    let activities = data.data.activity;

    let accessoriesToAdd = [];
    var myHarmonyAccessory;
    let name = (this.devMode ? 'DEV' : '') + 'Switch';

    if (!this.publishSwitchActivitiesAsIndividualAccessories) {
      myHarmonyAccessory = this.harmonyBase.checkAccessory(this, name);
      if (!myHarmonyAccessory) {
        myHarmonyAccessory = this.harmonyBase.createAccessory(this, name);
        accessoriesToAdd.push(myHarmonyAccessory);
      }
      myHarmonyAccessory.category = Accessory.Categories.SWITCH;
      this._confirmedAccessories.push(myHarmonyAccessory);
    }

    for (let i = 0, len = activities.length; i < len; i++) {
      if (this.showActivity(activities[i])) {
        let switchName = this.devMode ? 'DEV' + activities[i].label : activities[i].label;

        if (this.publishSwitchActivitiesAsIndividualAccessories) {
          //Handle special case
          if (switchName === 'TV') switchName = 'TV-Switch';

          myHarmonyAccessory = this.harmonyBase.checkAccessory(this, switchName);
          if (!myHarmonyAccessory) {
            myHarmonyAccessory = this.harmonyBase.createAccessory(this, switchName);
            accessoriesToAdd.push(myHarmonyAccessory);
          }
          myHarmonyAccessory.category = Accessory.Categories.SWITCH;
          this._confirmedAccessories.push(myHarmonyAccessory);
        }

        this.log('(' + this.name + ')' + 'INFO - Discovered Activity : ' + switchName);
        let subType = switchName;
        let service = this.harmonyBase.getSwitchService(
          this,
          myHarmonyAccessory,
          switchName,
          subType
        );

        service.activityId = activities[i].id;
        service.type = HarmonyConst.ACTIVITY_TYPE;
        this._confirmedServices.push(service);

        this.bindCharacteristicEventsForSwitch(myHarmonyAccessory, service);
      }
    }

    return accessoriesToAdd;
  },

  readTVAccessories: function (data) {
    let activities = data.data.activity;
    let accessoriesToAdd = [];
    let name = (this.devMode ? 'DEV' : '') + 'TV';

    myHarmonyAccessory = this.harmonyBase.checkAccessory(this, name);

    if (!myHarmonyAccessory) {
      myHarmonyAccessory = this.harmonyBase.createAccessory(this, name);
      accessoriesToAdd.push(myHarmonyAccessory);
    }

    myHarmonyAccessory.category = Accessory.Categories.TELEVISION;
    this._confirmedAccessories.push(myHarmonyAccessory);

    this.log('(' + this.name + ')' + 'INFO - configuring Main TV Service');
    this.configureMainService(myHarmonyAccessory);

    let mainActivityConfigured = false;
    let defaultActivity = undefined;

    //Pre-sort so the input sorces are set alphabetically or by activityOrder
    // "sort input list in TV accessory : 0-default,1:Alpha,2:activityOrder property of hub, 3:activitiesToPublishAsInputForTVMode order (defaults to 0).",
    this.log.debug('(' + this.name + ')' + 'INFO - accessories : Sort Order : ' + this.sortInput);

    if (this.sortInput == 1) activities.sort((a, b) => a.label.localeCompare(b.label));
    else if (this.sortInput == 2) activities.sort((a, b) => a.activityOrder - b.activityOrder);
    else if (this.sortInput == 2) activities.sort((a, b) => a.activityOrder - b.activityOrder);
    else if (this.sortInput > 2 && this.activitiesToPublishAsInputForTVMode) {
      const sorter = (a, b) => {
        if (this.activitiesToPublishAsInputForTVMode.includes(a.label)) {
          return -1;
        }
        if (this.activitiesToPublishAsInputForTVMode.includes(b.label)) {
          return 1;
        }
        return 0;
      };
      activities.sort(sorter);
    }

    for (let i = 0, len = activities.length; i < len; i++) {
      if (this.showInput(activities[i])) {
        let inputName = this.devMode ? 'DEV' + activities[i].label : activities[i].label;
        let inputId = activities[i].id;

        this.log.debug(
          '(' + this.name + ')' + 'INFO - accessories : activity to configure : ' + inputName
        );

        if (this.mainActivity == inputName) {
          this.configureMainActivity(myHarmonyAccessory, activities[i]);
          mainActivityConfigured = true;
        } else if (defaultActivity == undefined) {
          defaultActivity = activities[i];
        }

        let inputSourceService = this.configureInputSourceService(
          myHarmonyAccessory,
          inputName,
          inputId,
          activities[i],
          this.inputServices.length + 1
        );

        this.mainService.addLinkedService(inputSourceService);
        this.inputServices.push(inputSourceService);
      }
    }

    if (!mainActivityConfigured) {
      this.log(
        '(' +
          this.name +
          ')' +
          'WARNING - No main Activity that match config file found, default to first one'
      );
      if (defaultActivity == undefined)
        this.log(
          '(' + this.name + ')' + 'ERROR - No  Activity at all was found for this TV accessory'
        );
      else this.configureMainActivity(myHarmonyAccessory, defaultActivity);
    }

    //AccessControl
    if (this.configureAccesscontrol) this.configureAccessControlService(myHarmonyAccessory);

    this.bindCharacteristicEventsForInputs(myHarmonyAccessory);

    this.TVFoundAccessory = myHarmonyAccessory;

    return accessoriesToAdd;
  },

  //TV METHODS

  configureAccessControlService: function (myHarmonyAccessory) {
    ////

    try {
      //acces control
      this.log('(' + this.name + ')' + 'INFO - configuring Access Control Service');
      let subType = this.name + ' AccessControlService';
      this.accessControlService = myHarmonyAccessory.getServiceByUUIDAndSubType(this.name, subType);
      var accessControl;

      if (!this.accessControlService) {
        accessControl = new AccessControlManagement(true);
        this.accessControlService = accessControl.getService();
        this.accessControlService.subtype = subType;
        this.accessControlService.displayName = this.name;
        myHarmonyAccessory.addService(this.accessControlService);
      } else {
        accessControl = new AccessControlManagement(true, this.accessControlService);
      }

      this._confirmedServices.push(this.accessControlService);

      accessControl.on(AccessControlEvent.ACCESS_LEVEL_UPDATED, (level) => {
        this.log(
          '(' +
            this.name +
            ')' +
            'INFO - New access control level of ' +
            level +
            '/' +
            myHarmonyAccessory.displayName
        );
      });
      accessControl.on(
        AccessControlEvent.PASSWORD_SETTING_UPDATED,
        (password, passwordRequired) => {
          if (passwordRequired) {
            this.log(
              '(' +
                this.name +
                ')' +
                'INFO - New access control - Required password is: ' +
                password +
                '/' +
                myHarmonyAccessory.displayName
            );
          } else {
            this.log(
              '(' +
                this.name +
                ')' +
                'INFO - access control - No password set! ' +
                '/' +
                myHarmonyAccessory.displayName
            );
          }
        }
      );
    } catch {
      this.log(
        '(' +
          this.name +
          ')' +
          'ERROR - error adding control service, you should try to restart (possible cache problem because of previous bug) or you are not on correct homebridge version' +
          '/' +
          myHarmonyAccessory.displayName
      );
    }
  },

  configureMainService: function (accessory) {
    let subType = this.name + ' TV';
    this.mainService = accessory.getServiceByUUIDAndSubType(this.name, subType);

    if (!this.mainService) {
      this.log('(' + this.name + ')' + 'INFO - Creating TV Service');
      this.mainService = new Service.Television(this.name, 'tvService' + this.name);
      this.mainService.subtype = subType;
      accessory.addService(this.mainService);
    }
    this._confirmedServices.push(this.mainService);

    if (this.savedNames && this.savedNames[0]) {
      mainServiceName = this.savedNames[0];
    } else {
      mainServiceName = this.name;
    }

    this.mainService
      .setCharacteristic(Characteristic.ConfiguredName, mainServiceName)
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(
        Characteristic.SleepDiscoveryMode,
        Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      )
      .setCharacteristic(Characteristic.Active, false);

    this.bindCharacteristicEventsForTV(accessory);

    this.inputServices = [];
    this.log.debug(
      '(' + this.name + ')' + 'INFO - accessories : main activity name : ' + this.mainActivity
    );
  },

  configureMainActivity: function (accessory, activity) {
    let inputName = activity.label;
    if (this.devMode) {
      inputName = 'DEV' + inputName;
    }
    this.log('(' + this.name + ')' + 'INFO - Configuring Main Activity ' + inputName);

    this.mainActivityId = activity.id;
    this.mainService.activityName = inputName;
    this.mainService.activityId = activity.id;

    let subType = this.name + ' Volume';
    this.tvSpeakerService = accessory.getServiceByUUIDAndSubType(this.name, subType);

    if (!this.tvSpeakerService) {
      this.log('(' + this.name + ')' + 'INFO - Creating TV Speaker Service');
      this.tvSpeakerService = new Service.TelevisionSpeaker(this.name, 'TVSpeaker' + this.name);
      this.tvSpeakerService.subtype = subType;
      accessory.addService(this.tvSpeakerService);
    }
    this._confirmedServices.push(this.tvSpeakerService);

    this.tvSpeakerService
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE)
      .setCharacteristic(
        Characteristic.VolumeControlType,
        Characteristic.VolumeControlType.ABSOLUTE
      );

    this.bindCharacteristicEventsForSpeaker(this.tvSpeakerService);

    this.mainService.addLinkedService(this.tvSpeakerService);
  },

  configureInputSourceService: function (accessory, inputName, inputId, activity, order) {
    let subType = inputName + ' Activity';
    let inputSourceService = accessory.getServiceByUUIDAndSubType(this.name, subType);

    if (!inputSourceService) {
      this.log(
        '(' +
          this.name +
          ')' +
          'INFO - Creating Input Service - ' +
          inputName +
          ' in position ' +
          order
      );
      inputSourceService = new Service.InputSource(this.name, 'Input' + this.name + inputName);
      inputSourceService.subtype = subType;
      accessory.addService(inputSourceService);
    }

    this._confirmedServices.push(inputSourceService);

    inputSourceService.activityName = inputName;
    inputSourceService.activityId = inputId;

    let controlGroup = activity.controlGroup;

    HarmonyAsTVKeysTools.mapKeys(this, controlGroup, inputName, inputSourceService);

    if (this.savedNames && this.savedNames[inputId]) {
      inputServiceName = this.savedNames[inputId];
    } else {
      inputServiceName = inputName;
    }

    inputSourceService
      .setCharacteristic(Characteristic.Identifier, order)
      .setCharacteristic(Characteristic.Name, inputName)
      .setCharacteristic(Characteristic.ConfiguredName, inputServiceName)
      .setCharacteristic(Characteristic.InputSourceType, Characteristic.InputSourceType.APPLICATION)
      .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED);

    return inputSourceService;
  },

  showInput: function (activity) {
    if (
      activity.id != -1 &&
      this.activitiesToPublishAsInputForTVMode &&
      !this.activitiesToPublishAsInputForTVMode.includes(activity.label)
    )
      return false;
    else return activity.id != -1;
  },

  ///REFRESHING TOOLS

  handleRefreshOfCharacteristic() {
    this.updateCurrentInputService();

    this.harmonyBase.handleCharacteristicUpdate(
      this,
      this.mainService.getCharacteristic(Characteristic.Active),
      this._currentInputService !== undefined
    );

    this.harmonyBase.handleCharacteristicUpdate(
      this,
      this.mainService.getCharacteristic(Characteristic.ActiveIdentifier),
      HarmonyTools.transformActivityIdToActiveIdentifier(
        this._currentInputService,
        this.inputServices
      )
    );
  },

  localRefresh: function () {
    //TV
    if (this.TVAccessory) this.handleRefreshOfCharacteristic();

    //SWITCH ACTIVITIEs
    if (this.isPlatformWithSwitch) {
      for (let a = 0; a < this._foundAccessories.length; a++) {
        let myHarmonyAccessory = this._foundAccessories[a];
        for (let s = 0; s < myHarmonyAccessory.services.length; s++) {
          let service = myHarmonyAccessory.services[s];
          if (
            service.type == HarmonyConst.ACTIVITY_TYPE ||
            service.type == HarmonyConst.GENERALVOLUME_TYPE ||
            service.type == HarmonyConst.GENERALVOLUMEUP_TYPE ||
            service.type == HarmonyConst.GENERALVOLUMEDOWN_TYPE
          )
            this.refreshService(service, false);
        }
      }
    }
  },

  refreshPlatform: function () {
    this.harmonyBase.refreshCurrentActivity(this, () => {
      this.harmonyBase.refreshHomeAccessory(this);
    });
  },

  updateCurrentInputService: function () {
    if (this._currentActivity > 0) {
      let inputFound = false;
      for (let i = 0, len = this.inputServices.length; i < len; i++) {
        if (this.inputServices[i].activityId == this._currentActivity) {
          this._currentInputService = this.inputServices[i];
          inputFound = true;
          break;
        }
      }
      if (!inputFound) {
        this._currentInputService = undefined;
      }
    } else {
      this._currentInputService = undefined;
    }

    this.keysMap = HarmonyAsTVKeysTools.mapKeysForActivity(this);
  },

  refreshCurrentActivityOnSubPlatform: function (response) {
    this._currentActivityLastUpdate = Date.now();

    if (response === undefined) return;
    this._currentActivity = response;

    this.localRefresh();
  },

  refreshService: function (service, callback) {
    var characteristic = service.getCharacteristic(Characteristic.On);

    //return immediately
    if (callback) {
      callback(undefined, service.getCharacteristic(Characteristic.On).value);
    }

    this.harmonyBase.refreshCurrentActivity(this, () => {
      if (this._currentActivity > HarmonyConst.CURRENT_ACTIVITY_NOT_SET_VALUE) {
        let characteristicIsOn = this.checkOn(service);

        this.log.debug(
          '(' +
            this.name +
            ')' +
            'Got status for ' +
            service.displayName +
            ' - was ' +
            characteristic.value +
            ' set to ' +
            characteristicIsOn
        );
        this.harmonyBase.handleCharacteristicUpdate(this, characteristic, characteristicIsOn);
      } else {
        this.log.debug('(' + this.name + ')' + 'WARNING : no current Activity');
        this.harmonyBase.handleCharacteristicUpdate(this, characteristic, characteristic.value);
      }
    });
  },

  ///COMANDS
  sendInputCommand: function (homebridgeAccessory, value) {
    let doCommand = true;
    let commandToSend = value;

    let inputName = commandToSend == -1 ? 'PowerOff' : '';

    for (let i = 0, len = this.inputServices.length; i < len; i++) {
      if (this.inputServices[i].activityId == commandToSend) {
        inputName = this.inputServices[i].activityName;
        break;
      }
    }

    if (HarmonyTools.isActivtyToBeSkipped(this, inputName)) {
      //GLOBAL OFF SWITCH : do command only if we are not off
      if (commandToSend == -1) {
        doCommand = this._currentActivity > 0;
      }
      //ELSE, we do the command only if state is different.
      else {
        doCommand = this._currentActivity !== value;
      }
    }

    if (doCommand) {
      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO - sendInputCommand : Activty ' +
          inputName +
          ' will be activated '
      );
    } else {
      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO - sendInputCommand : Activty ' +
          inputName +
          ' will not be activated '
      );
    }

    if (doCommand) {
      this.activityCommand(homebridgeAccessory, commandToSend);
    } else {
      setTimeout(() => {
        this.refreshPlatform();
      }, HarmonyConst.DELAY_TO_UPDATE_STATUS);
    }
  },

  handlePlayPause: function () {
    this.log.debug(
      '(' +
        this.name +
        ')' +
        'INFO - current play status is : ' +
        this.playStatus[this._currentActivity] +
        ' with playPause option set to :' +
        this.playPauseBehavior
    );
    this.log.debug(
      '(' +
        this.name +
        ')' +
        'INFO - pauseCommand defined for  : ' +
        this._currentActivity +
        ' is ' +
        this._currentInputService.PauseCommand
    );

    if (
      !this.playPauseBehavior ||
      this._currentInputService.PauseCommand === undefined ||
      this.playStatus[this._currentActivity] === undefined ||
      this.playStatus[this._currentActivity] === 'PAUSED'
    ) {
      this.log.debug('(' + this.name + ')' + 'INFO - sending PlayCommand for PLAY_PAUSE');
      //this.harmonyBase.sendCommand(this, this.keysMap[Characteristic.RemoteKey.PLAY_PAUSE]);
      HarmonyTools.processCommands(
        this.harmonyBase,
        this,
        this.keysMap[Characteristic.RemoteKey.PLAY_PAUSE]
      );

      this.playStatus[this._currentActivity] = '';
    } else {
      this.log.debug('(' + this.name + ')' + 'INFO - sending PauseCommand for PLAY_PAUSE');

      let overridePAUSE = HarmonyAsTVKeysTools.getOverrideCommand(this, 'PAUSE');
      if (!overridePAUSE) {
        this.harmonyBase.sendCommand(this, this._currentInputService.PauseCommand);
      } else {
        HarmonyTools.processCommands(this.harmonyBase, this, overridePAUSE);
      }

      this.playStatus[this._currentActivity] = 'PAUSED';
    }
  },

  //HOMEKIT CHARACTERISTICS EVENTS

  refreshCharacteristic: function (characteristic, callback) {
    if (callback) {
      //return immediately
      callback(undefined, characteristic.value);
    }

    this.harmonyBase.refreshCurrentActivity(this, () => {
      if (this._currentActivity > HarmonyConst.CURRENT_ACTIVITY_NOT_SET_VALUE) {
        if (characteristic.UUID == Characteristic.Active.UUID) {
          this.log.debug(
            '(' +
              this.name +
              ')' +
              'INFO - refreshCharacteristic : updating Characteristic.Active to ' +
              (this._currentInputService !== undefined)
          );
          this.harmonyBase.handleCharacteristicUpdate(
            this,
            characteristic,
            this._currentInputService !== undefined
          );
        } else if (characteristic.UUID == Characteristic.ActiveIdentifier.UUID) {
          this.log.debug(
            '(' +
              this.name +
              ')' +
              'INFO - refreshCharacteristic : updating Characteristic.ActiveIdentifier to ' +
              HarmonyTools.transformActivityIdToActiveIdentifier(
                this._currentInputService,
                this.inputServices
              )
          );
          this.harmonyBase.handleCharacteristicUpdate(
            this,
            characteristic,
            HarmonyTools.transformActivityIdToActiveIdentifier(
              this._currentInputService,
              this.inputServices
            )
          );
        }
      } else {
        this.log.debug(
          '(' + this.name + ')' + 'WARNING - refreshCharacteristic : no current Activity'
        );
        if (characteristic.UUID == Characteristic.Active.UUID) {
          this.harmonyBase.handleCharacteristicUpdate(this, characteristic, false);
        } else if (characteristic.UUID == Characteristic.ActiveIdentifier.UUID) {
          this.harmonyBase.handleCharacteristicUpdate(this, characteristic, 0);
        }
      }
    });
  },

  bindActiveCharacteristic(characteristic, service, homebridgeAccessory) {
    //set to main activity / activeIdentifier or off

    characteristic.on(
      'set',
      function (value, callback) {
        this.log.debug('(' + this.name + ')' + 'INFO - SET Characteristic.Active ' + value);
        this.log.debug(
          '(' +
            this.name +
            ')' +
            'INFO - value of Characteristic.ActiveIdentifier ' +
            service.getCharacteristic(Characteristic.ActiveIdentifier).value
        );

        if (value == 0) {
          this.log.debug('(' + this.name + ')' + 'INFO - switching off');
          this.sendInputCommand(homebridgeAccessory, '-1');

          callback(null);
        } else {
          //we push back the execution to let the second event be taken care of in case of switching on with a dedicated input.
          setTimeout(() => {
            if (this._currentInputService == undefined) {
              var currentActivity = HarmonyTools.transformActiveIdentifierToActivityId(
                service.getCharacteristic(Characteristic.ActiveIdentifier).value,
                this.inputServices
              );

              if (currentActivity <= 0) {
                this.log.debug(
                  '(' +
                    this.name +
                    ')' +
                    'INFO - launching with default Activity - ' +
                    this.mainActivityId
                );
                this.sendInputCommand(homebridgeAccessory, '' + this.mainActivityId);
              } else {
                this.log.debug(
                  '(' +
                    this.name +
                    ')' +
                    'INFO - not launching, an activeinput is set - ' +
                    currentActivity
                );
              }
            } else {
              this.log.debug(
                '(' +
                  this.name +
                  ')' +
                  'INFO - not launching, there is a current Activity defined -' +
                  this.mainActivityId
              );
            }
          }, HarmonyConst.DELAY_TO_UPDATE_STATUS);
          callback(null);
        }
      }.bind(this)
    );

    characteristic.on(
      'get',
      function (callback) {
        this.log.debug('(' + this.name + ')' + 'INFO - GET Characteristic.Active ');
        this.refreshCharacteristic(characteristic, callback);
      }.bind(this)
    );
  },

  bindActiveIdentifierCharacteristic: function (characteristic, homebridgeAccessory) {
    //set the current Activity
    characteristic.on(
      'set',
      function (value, callback) {
        this.log.debug(
          '(' + this.name + ')' + 'INFO - SET Characteristic.ActiveIdentifier ' + value
        );
        this.sendInputCommand(
          homebridgeAccessory,
          '' + HarmonyTools.transformActiveIdentifierToActivityId(value, this.inputServices)
        );
        callback(null);
      }.bind(this)
    );
    characteristic.on(
      'get',
      function (callback) {
        this.log.debug('(' + this.name + ')' + 'INFO - GET Characteristic.ActiveIdentifier');
        this.refreshCharacteristic(characteristic, callback);
      }.bind(this)
    );
  },

  bindRemoteKeyCharacteristic: function (characteristic) {
    characteristic.on(
      'set',
      function (newValue, callback) {
        this.log.debug(
          '(' +
            this.name +
            ')' +
            'INFO - SET Characteristic.RemoteKey : ' +
            newValue +
            ' with currentActivity ' +
            this._currentActivity
        );

        if (this._currentActivity > 0) {
          if (newValue === Characteristic.RemoteKey.PLAY_PAUSE) {
            this.handlePlayPause();
          } else if (this.keysMap[newValue]) {
            this.log.debug(
              '(' +
                this.name +
                ')' +
                'INFO - sending command ' +
                this.keysMap[newValue] +
                'for ' +
                newValue
            );

            if (Array.isArray(this.keysMap[newValue]))
              HarmonyTools.processCommands(this.harmonyBase, this, this.keysMap[newValue]);
            else this.harmonyBase.sendCommand(this, this.keysMap[newValue]);
          } else {
            this.log.debug('(' + this.name + ')' + 'INFO - no command to send for ' + newValue);
          }
        }
        callback(null);
      }.bind(this)
    );
  },

  bindMuteCharacteristic(characteristic) {
    characteristic.on(
      'set',
      function (value, callback) {
        if (this._currentInputService !== undefined) {
          this.log.debug('(' + this.name + ')' + 'INFO - SET Characteristic.Mute : ' + value);

          let overrideMUTE = HarmonyAsTVKeysTools.getOverrideCommand(this, 'MUTE');
          if (!overrideMUTE) {
            this.harmonyBase.sendCommand(this, this._currentInputService.MuteCommand);
          } else {
            HarmonyTools.processCommands(this.harmonyBase, this, overrideMUTE);
          }
        }
        callback(null);
      }.bind(this)
    );

    characteristic.on(
      'get',
      function (callback) {
        this.log.debug('(' + this.name + ')' + 'INFO - GET Characteristic.Mute');
        callback(null, false);
      }.bind(this)
    );
  },

  bindVolumeSelectorCharacteristic(characteristic) {
    characteristic.on(
      'set',
      function (value, callback) {
        if (this._currentInputService !== undefined) {
          this.log.debug(
            '(' + this.name + ')' + 'INFO - SET Characteristic.VolumeSelector : ' + value
          );
          if (value === Characteristic.VolumeSelector.DECREMENT) {
            let overrideVOLUMEDOWN = HarmonyAsTVKeysTools.getOverrideCommand(this, 'VOLUME_DOWN');
            if (!overrideVOLUMEDOWN) {
              this.harmonyBase.sendCommand(
                this,
                this._currentInputService.VolumeDownCommand +
                  '|' +
                  this.numberOfCommandsSentForVolumeControl
              );
            } else {
              HarmonyTools.processCommands(this.harmonyBase, this, overrideVOLUMEDOWN);
            }
          } else {
            let overrideVOLUMEUP = HarmonyAsTVKeysTools.getOverrideCommand(this, 'VOLUME_UP');
            if (!overrideVOLUMEUP) {
              this.harmonyBase.sendCommand(
                this,
                this._currentInputService.VolumeUpCommand +
                  '|' +
                  this.numberOfCommandsSentForVolumeControl
              );
            } else {
              HarmonyTools.processCommands(this.harmonyBase, this, overrideVOLUMEUP);
            }
          }
        }
        callback(null);
      }.bind(this)
    );
  },

  bindVolumeCharacteristic(characteristic) {
    characteristic.on(
      'set',
      function (value, callback) {
        if (this._currentActivity > 0) {
          this.log.debug('(' + this.name + ')' + 'INFO - SET Characteristic.Volume : ' + value);
          this.volumesLevel[this._currentActivity] = value;
        }
        callback(null);
      }.bind(this)
    );

    characteristic.on(
      'get',
      function (callback) {
        this.log.debug('(' + this.name + ')' + 'INFO - GET Characteristic.Volume');

        if (this.volumesLevel[this._currentActivity])
          callback(null, this.volumesLevel[this._currentActivity]);
        else callback(null, HarmonyConst.DEFAULT_VOLUME);
      }.bind(this)
    );
  },

  bindConfiguredNameCharacteristic: function (characteristic, service) {
    characteristic.on(
      'set',
      function (value, callback) {
        this.log.debug(
          '(' + this.name + ')' + 'INFO - SET Characteristic.ConfiguredName : ' + value
        );

        var idConf = 0;
        if (service.UUID == Service.InputSource.UUID) idConf = service.activityId;

        this.savedNames[idConf] = value;
        fs.writeFile(this.savedNamesFile, JSON.stringify(this.savedNames), (err) => {
          if (err) {
            this.log(
              '(' + this.name + ')' + 'ERROR - error occured could not write configured name %s',
              err
            );
          } else {
            this.log.debug(
              '(' +
                this.name +
                ')' +
                'INFO - configured name successfully saved! New name: %s ID: %s',
              value,
              idConf
            );
          }
        });

        callback(null);
      }.bind(this)
    );
  },

  bindCurrentVisibilityStateCharacteristic: function (characteristic, service) {
    characteristic.on(
      'get',
      function (callback) {
        let idConf = service.activityId;
        this.log.debug(
          '(' +
            this.name +
            ')' +
            'INFO - GET Characteristic.CurrentVisibilityState : ' +
            (this.savedVisibility[idConf]
              ? this.savedVisibility[idConf]
              : 'DEFAULT - ' + Characteristic.TargetVisibilityState.SHOWN)
        );
        if (this.savedVisibility[idConf]) callback(null, this.savedVisibility[idConf]);
        else callback(null, Characteristic.CurrentVisibilityState.SHOWN);
      }.bind(this)
    );
  },

  bindTargetVisibilityStateCharacteristic(characteristic, service) {
    characteristic.on(
      'get',
      function (callback) {
        let idConf = service.activityId;
        this.log.debug(
          '(' +
            this.name +
            ')' +
            'INFO - GET Characteristic.TargetVisibilityState : ' +
            (this.savedVisibility[idConf]
              ? this.savedVisibility[idConf]
              : 'DEFAULT - ' + Characteristic.TargetVisibilityState.SHOWN)
        );
        if (this.savedVisibility[idConf]) callback(null, this.savedVisibility[idConf]);
        else callback(null, Characteristic.TargetVisibilityState.SHOWN);
      }.bind(this)
    );

    characteristic.on(
      'set',
      function (value, callback) {
        this.log.debug(
          '(' + this.name + ')' + 'INFO - SET Characteristic.TargetVisibilityState : ' + value
        );

        let idConf = service.activityId;

        let oldValue = this.savedVisibility[idConf]
          ? this.savedVisibility[idConf]
          : Characteristic.CurrentVisibilityState.SHOWN;
        this.savedVisibility[idConf] = value;
        fs.writeFile(this.savedVisibilityFile, JSON.stringify(this.savedVisibility), (err) => {
          if (err) {
            this.savedVisibility[idConf] = oldValue;
            this.log(
              '(' + this.name + ')' + 'ERROR - error occured could not write visibility state %s',
              err
            );
          } else {
            this.log.debug(
              '(' +
                this.name +
                ')' +
                'INFO - configured visibility successfully saved! New visibility: %s ID: %s',
              value,
              idConf
            );
          }

          service
            .getCharacteristic(Characteristic.CurrentVisibilityState)
            .updateValue(this.savedVisibility[idConf]);

          callback(null);
        });
      }.bind(this)
    );
  },

  bindPowerModeSelectionCharacteristic(characteristic) {
    characteristic.on(
      'set',
      function (value, callback) {
        if (this._currentInputService !== undefined) {
          this.log.debug(
            '(' + this.name + ')' + 'INFO - SET Characteristic.PowerModeSelection : ' + value
          );

          let overrideSETUP = HarmonyAsTVKeysTools.getOverrideCommand(this, 'SETUP');
          if (!overrideSETUP) {
            this.harmonyBase.sendCommand(this, this._currentInputService.SetupCommand);
          } else {
            HarmonyTools.processCommands(this.harmonyBase, this, overrideSETUP);
          }
        }
        callback(null);
      }.bind(this)
    );
  },

  bindCharacteristicEventsForTV: function (homebridgeAccessory) {
    this.bindActiveCharacteristic(
      this.mainService.getCharacteristic(Characteristic.Active),
      this.mainService,
      homebridgeAccessory
    );

    this.bindActiveIdentifierCharacteristic(
      this.mainService.getCharacteristic(Characteristic.ActiveIdentifier),
      homebridgeAccessory
    );

    this.bindRemoteKeyCharacteristic(this.mainService.getCharacteristic(Characteristic.RemoteKey));

    this.bindPowerModeSelectionCharacteristic(
      this.mainService.getCharacteristic(Characteristic.PowerModeSelection)
    );

    this.bindConfiguredNameCharacteristic(
      this.mainService.getCharacteristic(Characteristic.ConfiguredName),
      this.mainService
    );
  },

  bindCharacteristicEventsForSpeaker: function () {
    this.bindMuteCharacteristic(this.tvSpeakerService.getCharacteristic(Characteristic.Mute));
    this.bindVolumeSelectorCharacteristic(
      this.tvSpeakerService.getCharacteristic(Characteristic.VolumeSelector)
    );
    this.bindVolumeCharacteristic(this.tvSpeakerService.getCharacteristic(Characteristic.Volume));
  },

  bindCharacteristicEventsForInputs: function () {
    for (let i = 0, len = this.inputServices.length; i < len; i++) {
      this.bindConfiguredNameCharacteristic(
        this.inputServices[i].getCharacteristic(Characteristic.ConfiguredName),
        this.inputServices[i]
      );

      this.bindCurrentVisibilityStateCharacteristic(
        this.inputServices[i].getCharacteristic(Characteristic.CurrentVisibilityState),
        this.inputServices[i]
      );

      this.bindTargetVisibilityStateCharacteristic(
        this.inputServices[i].getCharacteristic(Characteristic.TargetVisibilityState),
        this.inputServices[i]
      );
    }
  },

  //SWITCHES METHODS

  showActivity: function (activity) {
    if (
      activity.id != -1 &&
      this.activitiesToPublishAsAccessoriesSwitch &&
      !this.activitiesToPublishAsAccessoriesSwitch.includes(activity.label)
    )
      return false;
    else return activity.id != -1 || this.showTurnOffActivity;
  },

  checkOn(service) {
    this.log.debug(
      '(' +
        this.name +
        ')' +
        'checkOn : ' +
        this._currentActivity +
        '/' +
        service.type +
        '/' +
        service.activityId +
        '/' +
        (this.showTurnOffActivity == 'inverted') +
        '/' +
        (this.showTurnOffActivity == 'stateless')
    );

    if (service.type == HarmonyConst.GENERALVOLUME_TYPE) {
      return (
        this._currentActivity > -1 &&
        service.volumeDownCommands[this._currentActivity] !== undefined &&
        service.volumeUpCommands[this._currentActivity] !== undefined
      );
    } else if (service.type == HarmonyConst.GENERALVOLUMEUP_TYPE) {
      return (
        this._currentActivity > -1 && service.volumeUpCommands[this._currentActivity] !== undefined
      );
    } else if (service.type == HarmonyConst.GENERALVOLUMEDOWN_TYPE) {
      return (
        this._currentActivity > -1 &&
        service.volumeDownCommands[this._currentActivity] !== undefined
      );
    } else if (service.activityId == -1) {
      if (
        this._currentActivity == -1 &&
        (this.showTurnOffActivity == 'inverted' || this.showTurnOffActivity == 'stateless')
      ) {
        return false;
      }
      if (this._currentActivity != -1 && this.showTurnOffActivity == 'inverted') {
        return true;
      }
    }

    return this._currentActivity == service.activityId;
  },

  handleActivityOk: function (commandToSend) {
    this._currentSetAttemps = 0;
    this._currentActivity = commandToSend;
    this._currentActivityLastUpdate = Date.now();

    for (let a = 0; a < this._foundAccessories.length; a++) {
      let foundHarmonyAccessory = this._foundAccessories[a];
      for (let s = 0; s < foundHarmonyAccessory.services.length; s++) {
        let otherService = foundHarmonyAccessory.services[s];

        if (otherService.type == HarmonyConst.ACTIVITY_TYPE) {
          let characteristic = otherService.getCharacteristic(Characteristic.On);

          HarmonyTools.disablePreviousActivity(
            this,
            characteristic,
            otherService,
            commandToSend,
            characteristic.value
          );
          HarmonyTools.handleOffActivity(this, characteristic, otherService, commandToSend);
        }
      }
    }
  },

  getService: function (homebridgeAccessory, idToFind) {
    var service;
    for (let a = 0; a < homebridgeAccessory.services.length; a++) {
      if (homebridgeAccessory.services[a].ActivityId == idToFind) {
        service = homebridgeAccessory.services[a];
        this.log.debug('(' + this.name + ')' + 'INFO - ' + service.displayName + ' activated');
        break;
      }
    }
    return service;
  },

  handleActivityInProgress: function (homebridgeAccessory, commandToSend) {
    this._currentSetAttemps = this._currentSetAttemps + 1;

    //we try again with a delay of 1sec since an activity is in progress and we couldn't update the one.
    setTimeout(() => {
      if (this._currentSetAttemps < HarmonyConst.MAX_ATTEMPS_STATUS_UPDATE) {
        this.log.debug(
          '(' + this.name + ')' + 'INFO - activityCommand : RETRY to send command ' + commandToSend
        );
        this.activityCommand(homebridgeAccessory, commandToSend);
      } else {
        this.log(
          '(' +
            this.name +
            ')' +
            'ERROR - activityCommand : could not SET status, no more RETRY : ' +
            commandToSend
        );
        this.refreshPlatform();
      }
    }, HarmonyConst.DELAY_BETWEEN_ATTEMPS_STATUS_UPDATE);
  },

  activityCommand: function (homebridgeAccessory, commandToSend) {
    this.harmonyBase.harmony
      .startActivity(commandToSend)
      .then((data) => {
        this.log.debug(
          '(' +
            this.name +
            ')' +
            'INFO - activityCommand : Returned from hub ' +
            JSON.stringify(data)
        );

        if (HarmonyTools.isCommandOk(data)) {
          this.handleActivityOk(commandToSend);
          if (this.TVAccessory) this.handleRefreshOfCharacteristic();
        } else if (HarmonyTools.isCommandInProgress(data)) {
          this.log.debug(
            '(' +
              this.name +
              ')' +
              'WARNING - activityCommand : could not SET status : ' +
              JSON.stringify(data)
          );
          this.handleActivityInProgress(homebridgeAccessory, commandToSend);
        } else {
          this.log(
            '(' + this.name + ')' + 'ERROR - activityCommand : could not SET status, no data'
          );
        }
      })
      .catch((e) => {
        this.log('(' + this.name + ')' + 'ERROR - activityCommand : ' + e);
      });
  },

  setSwitchOnCharacteristic: function (
    homebridgeAccessory,
    characteristic,
    service,
    value,
    callback
  ) {
    let doCommand = true;
    let commandToSend = value ? service.activityId : '-1';
    let currentValue = characteristic.value;

    //Actitiy in skippedIfSameState
    if (HarmonyTools.isActivtyToBeSkipped(this, service.subtype)) {
      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO : SET on an activty in skippedIfsameState list ' +
          service.subtype
      );

      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO : Activty ' +
          service.subtype +
          ' is ' +
          currentValue +
          ', wants to set to ' +
          value
      );

      //GLOBAL OFF SWITCH : do command only if it is off and we want to set it on since on state can't be reversed
      //ELSE, we do the command only if state is different.
      doCommand =
        service.activityId == -1
          ? (this.showTurnOffActivity == 'inverted' && currentValue && !value) ||
            (this.showTurnOffActivity != 'inverted' && !currentValue && value)
          : currentValue !== value;
    } else {
      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO : SET on an activty not in skippedIfSameStateActivities list ' +
          service.subtype
      );
    }

    if (doCommand) {
      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO : Activty ' +
          service.subtype +
          ' will be sent command ' +
          commandToSend
      );
      this.activityCommand(homebridgeAccessory, commandToSend);
      callback();
    } else {
      this.log.debug(
        '(' +
          this.name +
          ')' +
          'INFO : Activty ' +
          service.subtype +
          ' will not be sent any command '
      );
      callback();
      setTimeout(() => {
        characteristic.updateValue(currentValue);
      }, HarmonyConst.DELAY_TO_UPDATE_STATUS);
    }
  },

  bindCharacteristicEventsForSwitch: function (homebridgeAccessory, service) {
    service
      .getCharacteristic(Characteristic.On)
      .on(
        'set',
        function (value, callback) {
          this.setSwitchOnCharacteristic(
            homebridgeAccessory,
            service.getCharacteristic(Characteristic.On),
            service,
            value,
            callback
          );
        }.bind(this)
      )
      .on(
        'get',
        function (callback) {
          this.refreshService(service, callback);
        }.bind(this)
      );
  },
};
