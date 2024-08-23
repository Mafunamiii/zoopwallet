import express from 'express';
import {router} from "./routes";
import {loggerCreate} from "./utils";
import {requestLogger} from "./middleware";

const app = express();
const logger = loggerCreate('app');


app.use(express.json());
app.use('/zoopAPI', router);
logger.info('Express app initialized');



export default app;