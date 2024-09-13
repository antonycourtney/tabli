import loglevel, { Logger } from 'loglevel';
import prefix from 'loglevel-plugin-prefix';

// initialize exported 'log' variable so
// that logging will work even before initLogger() is called.
export var log: loglevel.Logger = loglevel.default;

export var componentName: string;

export function initGlobalLogger(component: string) {
    componentName = component;
    log = loglevel.getLogger(componentName);
    prefix.apply(log, { template: '%l (%n):' });
    log.info('initLogger');
}

const knownLoggers: { [loggerName: string]: Logger } = {};

export function getLogger(loggerName: string) {
    let logger = knownLoggers[loggerName];
    if (!logger) {
        logger = loglevel.getLogger(loggerName);
        const fn = (level: string, name: string | undefined) =>
            `${level} (${componentName}) (${name}):`;
        prefix.apply(logger, { format: fn });
        knownLoggers[loggerName] = logger;
    }
    return logger;
}
