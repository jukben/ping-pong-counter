# Ping Pong Counter

## Overview

Ping Pong Counter is a straightforward application designed to help you keep track of scores during a ping pong game. It seamlessly integrates with [Hama BRS3 Bluetooth](https://www.alza.cz/hama-brs3-bluetooth-d6190011.htm) for a convenient experience.

## Features

- Easily increment the score for either player by clicking on their respective buttons.
- When one of the players reaches 11 points, the game ends, and you can reset the score to 0-0.
- The app conveniently keeps track of who's serving.
- Logs the history of the game, so you can see how the score changed over time.

## Development

To develop this app, you must have Node.js installed on your system. For streamlined development, you can emulate controllers mapped to the "s" and "a" keys. Simply follow these steps:

```bash
npm install
npm run dev
```

If you prefer to use real controllers, follow these instructions:

```bash
npm install
npm run start
```

Feel free to contribute to the project and improve the ping pong experience!
