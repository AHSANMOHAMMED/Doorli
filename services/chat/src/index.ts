import { createApp } from './app.js';

const port = process.env.PORT || 3013;

const { httpServer } = createApp();

httpServer.listen(port, () => {
  console.log(`Chat service listening on port ${port}`);
});
