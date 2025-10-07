import app from './app';
import { connectDB } from './config/database';

const PORT = parseInt(process.env.PORT || '3000', 10);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

start();
