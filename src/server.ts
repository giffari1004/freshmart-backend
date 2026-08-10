import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});