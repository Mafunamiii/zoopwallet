import { createLogger, format, transports } from 'winston';

const serviceFormat = format((info) => {
    info.service = info.service || 'unknown';
    return info;
})();


const logFormat = format.printf(({ timestamp, level, message, service, ...metadata }) => {
    let formattedMessage = message;

    if (metadata && metadata.stack) {
        formattedMessage += `\n${metadata.stack}`;
        delete metadata.stack;
    }

    const meta = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level}] [${service}]: ${formattedMessage}${meta}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        serviceFormat,
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.colorize(),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.Console(),
    ],
});

export const loggerCreate = (serviceName: string) => {
    return logger.child({ service: serviceName });
};
