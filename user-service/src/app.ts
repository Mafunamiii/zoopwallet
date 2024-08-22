import express from 'express';
import {userRouter} from "./src/routes";
import {loggerCreate} from "./src";
import {requestLogger} from "./src";

const app = express();
const logger = loggerCreate('app');


app.use(express.json());
app.use('/zoopAPI', userRouter);
app.use(requestLogger);
logger.info('Express app initialized');



export default app;