import { loadSettings } from './config.js';
import { createContainer } from './dependencies.js';
import { createApp } from './app.js';

const settings = loadSettings();
const container = createContainer(settings);
const app = createApp(container);

app.listen(settings.appPort, () => {
  console.log(`${settings.appName} running at http://localhost:${settings.appPort}`);
  console.log(`API docs at http://localhost:${settings.appPort}/docs`);
});
