import './env.js';
import { createApp } from './app.js';
import { startEmbassyUpdater } from './services/embassyUpdater.js';

const port = Number(process.env.PORT ?? 8081);
const app = createApp();

app.listen(port, () => {
  console.log(`Visa With Ease API listening on http://localhost:${port}`);
  startEmbassyUpdater();
});
