import winston from 'winston';

const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export default logger;
