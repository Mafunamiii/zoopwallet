import express from 'express';
import {userRouter} from "./routes";
import {loggerCreate} from "./utils";
import {requestLogger} from "./middleware";

const app = express();
const logger = loggerCreate('user-service-app');
const reqlogger = requestLogger('user-service');

app.use(express.json());
app.use(reqlogger);
app.use('/user', userRouter);
logger.info('Express app initialized');

app.get('/user',(req,res)=>{

})

export default app;