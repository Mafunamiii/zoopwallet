import express from 'express';
import {loggerCreate, requestLogger} from "./index";


const app = express();
const logger = loggerCreate('user-service-app');
const reqlogger = requestLogger('user-service');

app.use(express.json());
app.use(reqlogger);
logger.info('Express app initialized');

app.get('/user',(req,res)=>{
    res.send('Hello World');
    logger.info('Hello World');
})


export default app;