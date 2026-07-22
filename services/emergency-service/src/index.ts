import { createApp } from './app.js';

const port = process.env.PORT || 8087;

const app = createApp();

app.listen(port, () => {
  console.log(`Forum service listening on port ${port}`);
});
