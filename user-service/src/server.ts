import app from './app';
import {loggerCreate} from "./src";
import {connectToDatabase} from "../src/config";

const PORT = process.env.PORT || 8080;
const logger = loggerCreate('user-service-server');

connectToDatabase();
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
})