let Pico = require('./pico-remote');
let config = require('./config.json');

let client = new Pico.PicoRemote(console, { integrationReport: config.platforms[0].integrationReport, host: config.platforms[0].host });

client.on('device', (event) => {
    console.log('Event: ', event);
})

process.on('exit', (code) => {
    console.log(`About to exit with code: ${code}`);
});
