"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("../core/core");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
const databaseConfig = {
    host: 'localhost',
    port: 5432,
    username: 'admin',
    password: 'secret123'
};
// Example 2: Injecting a service instance
let LoggerService = class LoggerService {
    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }
};
const loggerInstance = new LoggerService();
// Example 3: Injecting a constant value
const API_VERSION = 'v1';
const MAX_RETRIES = 3;
// Register the values in the container
const container = _core.DIContainer.getInstance();
// Register configuration
container.register('DATABASE_CONFIG', databaseConfig, 'useValue');
// Register logger instance
container.register('LOGGER', loggerInstance, 'useValue');
// Register constants
container.register('API_VERSION', API_VERSION, 'useValue');
container.register('MAX_RETRIES', MAX_RETRIES, 'useValue');
// Example usage
let DatabaseService = class DatabaseService {
    connect() {
        this.logger.log(`Connecting to database at ${this.config.host}:${this.config.port}`);
        this.logger.log(`Using API version: ${this.apiVersion}`);
        this.logger.log(`Max retries configured: ${this.maxRetries}`);
    }
    constructor(config, logger, apiVersion, maxRetries){
        _define_property(this, "config", void 0);
        _define_property(this, "logger", void 0);
        _define_property(this, "apiVersion", void 0);
        _define_property(this, "maxRetries", void 0);
        this.config = config;
        this.logger = logger;
        this.apiVersion = apiVersion;
        this.maxRetries = maxRetries;
    }
};
// Usage - use getDependency instead of resolve
// Or create the service manually and inject dependencies from container
const dbService = new DatabaseService(container.getDependency('DATABASE_CONFIG'), container.getDependency('LOGGER'), container.getDependency('API_VERSION'), container.getDependency('MAX_RETRIES'));
dbService.connect();

//# sourceMappingURL=use-value-example.js.map