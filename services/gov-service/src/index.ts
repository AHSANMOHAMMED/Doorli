import { app } from './app';

const PORT = process.env.PORT || 8089;

app.listen(PORT, () => {
  console.log(`Gov service listening on port ${PORT}`);
});
