import express from 'express';
import {loggerCreate} from "./";
import {requestLogger} from "./";

const app = express();
const logger = loggerCreate('app');


app.use(express.json());
app.use(requestLogger);
logger.info('Express app initialized');



export default app;