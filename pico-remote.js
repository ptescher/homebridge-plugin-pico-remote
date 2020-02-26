const Telnet = require('telnet-client')
const EventEmitter = require('events');

class LutronTelnet extends EventEmitter {
    constructor(host, log) {
        super();
        this.host = host;
        this.log = log;
        this.connection = new Telnet()
        this.connection.on('data', (data) => {
            this.handleDataBuffer(data);
        })
    }

    async connect() {
        let params = {
            host: this.host,
            port: 23,
            shellPrompt: 'GNET> ',
            loginPrompt: 'login: ',
            passwordPrompt: 'password: ',
            username: 'lutron',
            password: 'integration',
            timeout: 1500,
            debug: true
        }

        return await this.connection.connect(params).catch(this.log.error);
    }

    handleDataBuffer(data) {
        let string = data.toString('ascii').trim();
        let parts = string.split(',');
        let command = {
            operation: parts[0],
            integrationId: parts[1],
            actionNumber: parts[2],
            parameters: parts[3],
        }
        this.handleCommand(command);
    }

    handleCommand(command) {
        this.emit('command', command);
    }
}

class PicoRemote extends EventEmitter {
    constructor(log, config) {
        super();
        if (!config) {
            log("No config found; exiting.");
            return;
        }
        this.log = log;
        this.config = config;
        this.lutronClient = new LutronTelnet(config.host, log);
        this.lutronClient.on('command', (command) => {
            const device = this.getDevice(command.integrationId);
            switch (command.operation) {
                case '~DEVICE':
                    this.emit('device', {device, operation: command.operation, actionNumber: command.actionNumber, parameters: command.parameters});
                    break;                    
                default:
                    break;
            }

        });
        this.lutronClient.connect().catch(log.error);
    }

    getDevice(integrationId) {
        const list = this.config.integrationReport.LIPIdList;
        const device = list.Devices.find(({ID}) => ID == integrationId) || list.Zones.find(({ID}) => ID == integrationId);
        return device;
    }
}

module.exports = {
    PicoRemote,
}