import { createLogger, format, transports } from 'winston';

// Define a custom format that includes the service name
const serviceFormat = format((info) => {
    info.service = info.service || 'unknown'; // Default to 'unknown' if not specified
    return info;
})();

// Define log format
const logFormat = format.printf(({ timestamp, level, message, service, ...metadata }) => {
    // Include metadata in the log output
    const meta = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level}] [${service}]: ${message}${meta}`;
});

// Create the logger
const logger = createLogger({
    level: 'info', // Default logging level
    format: format.combine(
        serviceFormat, // Add service to the log info
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.colorize(),
        logFormat
    ),
    transports: [
        new transports.Console(), // Log to the console
    ],
});

// Export a function to create a logger with a specific service context
export const loggerCreate = (serviceName: string) => {
    return logger.child({ service: serviceName });
};
