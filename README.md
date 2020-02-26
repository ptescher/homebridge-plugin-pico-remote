# Homebridge Plugin Pico Remote

## Status

Tested on:
- [ ] PJ-2B
- [ ] PJ-2BRL
- [ ] PJ-3B
- [ ] PJ-3BRL
- [ ] PJ2-2B
- [ ] PJ2-2BRL
- [ ] PJ2-3B
- [ ] PJ2-3BRL
- [x] PJ2-4B

## Setup

Enable telnet, then configure homebridge:
```json
{
    "platform": "PicoRemote",
    "name": "PicoRemote",
    "host": "lutron.localdomain",
    "integrationReport": {...}
}
```