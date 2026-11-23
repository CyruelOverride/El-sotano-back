import { app } from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en .env');
  process.exit(1);
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API Sótano en http://localhost:${port}`));
