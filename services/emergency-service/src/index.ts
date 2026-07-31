import { createApp } from './app.js';

const port = process.env.PORT || 8088;

const server = createApp();

server.listen(port, () => {
  console.log(`Emergency service listening on port ${port}`);
});
