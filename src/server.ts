import { app } from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`Peerup API listening on http://localhost:${config.port}`);
});
