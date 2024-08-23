import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes';
import config from './config';
import errorHandler from "./middleware/error.middleware";
import errorMiddleware from "./middleware/error.middleware";

const app = express();

mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));


console.log(process.env);

app.use(cors());
app.use(express.json());

// Use routes
app.use('/api', routes);

const PORT = config.port;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
