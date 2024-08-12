import app from './app';
import {loggerCreate} from "./index";

const PORT = process.env.PORT || 8080;
const logger = loggerCreate('user-service-server');

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
})