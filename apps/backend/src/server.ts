import './env.js';
import { createApp } from './app.js';
import { startEmbassyUpdater } from './services/embassyUpdater.js';

const port = Number(process.env.PORT ?? 8081);
const app = createApp();

app.listen(port, () => {
  console.log(`Visa With Ease API listening on http://localhost:${port}`);
  startEmbassyUpdater();
  // Erase accounts whose 30-day deletion window has passed (once shortly after start-up, then hourly).
  const purge = () => { void (app.locals.purgeOverdueAccounts as () => Promise<string[]>)().then((done) => { if (done.length) console.log(`Purged ${done.length} account(s) after their deletion window`); }).catch((e) => console.warn('account purge run failed', e)); };
  setTimeout(purge, 60_000);
  setInterval(purge, 3600_000);
});
