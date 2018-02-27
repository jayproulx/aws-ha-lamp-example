import {LoggerFactoryOptions, LFService, LogLevel, LogGroupRule, LoggerFactory} from 'typescript-logging';

export class Log {
    public static options:LoggerFactoryOptions = new LoggerFactoryOptions().addLogGroupRule(new LogGroupRule(/.+/, LogLevel.Debug));
    public static global:LoggerFactory = LFService.createNamedLoggerFactory("global", Log.options);
}