let Pico = require('./pico-remote');

const PluginName = 'homebridge-pico-remote';
const PlatformName = 'PicoRemote';
var Accessory, Service, Characteristic, UUIDGen;

class PicoRemoteAccessory {
    constructor(uuid, config, platformAccessory) {
        this.uuid = uuid;
        this.config = config;
        if (platformAccessory) {
            this.platformAccessory = platformAccessory;
        } else {
            this.platformAccessory = this.createPlatformAccessory();
        }
    }

    createPlatformAccessory() {
        const accessory = new Accessory(this.config.Name, this.uuid);

        if (this.config.Buttons) {
            for (var button in this.config.Buttons) {
                const buttonNumber = this.config.Buttons[button].Number;
                const buttonName = this.config.Buttons[button].Name || `Button ${buttonNumber}`;
                const uuid = UUIDGen.generate(`button-${buttonNumber}`);
                console.log('Adding new service', uuid, `button-${buttonNumber}`);
                accessory.addService(Service.StatelessProgrammableSwitch, buttonName, `button-${buttonNumber}`);
            }
        }

        return accessory;
    }

    category() {
        return Accessory.Categories.PROGRAMMABLE_SWITCH;
    }

    handleEvent(event) {
        console.log(event);
        const buttonNumber = new Number(event.actionNumber);
        const service = this.platformAccessory.getServiceByUUIDAndSubType(Service.StatelessProgrammableSwitch, `button-${buttonNumber}`);
        if (service) {
            const characteristic = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent);
            if (event.parameters === '4') { // TODO: Double press, long press
                characteristic.setValue(0);
            }
        }
    }
}

class PicoRemotePlatform {
    constructor(log, config, api) {
        this.log = log;
        this.accessories = [];
        this.platformAccessories = [];
        this.picoRemote = new Pico.PicoRemote(log, config);
        this.api = api;
        this.picoRemote.on('device', (event) => {
            const accessory = this.getAccessory(event.device);
            if (accessory) {
                accessory.handleEvent(event);
            }
        })
        this.api.on("didFinishLaunching", () => {
            this.createAccessories(config, log);
        });
    }

    configureAccessory(platformAccessory) {
        this.platformAccessories.push(platformAccessory);
    }

    createAccessories(config, log) {
        const list = config.integrationReport.LIPIdList;
        for (var device in list.Devices) {
            this.createAccessory(list.Devices[device], log);
        }
        for (var zone in list.Zones) {
            this.createAccessory(zone, log);
        }
    }

    createAccessory(config, log) {
        if (config.Buttons && config.Buttons.length == 4) {
            const uuid = UUIDGen.generate(config.Name);
            const accessory = new PicoRemoteAccessory(uuid, config);
            this.accessories.push(accessory);
            const existingAccessory = this.platformAccessories.find(({ UUID }) => UUID === accessory.platformAccessory.UUID);
            if (existingAccessory) {
                accessory.platformAccessory = existingAccessory;
            } else {
                this.platformAccessories.push(accessory.platformAccessory);
                this.api.registerPlatformAccessories(PluginName, PlatformName, [
                    accessory.platformAccessory
                ]);
            }
        }
    }

    getAccessory(device) {
        return this.accessories.find(({ config }) => config.ID === device.ID);
    }
}

module.exports = function (homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(
        PluginName,
        PlatformName,
        PicoRemotePlatform,
        true
    );
}