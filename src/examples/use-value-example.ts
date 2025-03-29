import { DIContainer } from '../core/core'

// Example 1: Injecting a configuration object
interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
}

const databaseConfig: DatabaseConfig = {
  host: 'localhost',
  port: 5432,
  username: 'admin',
  password: 'secret123',
}

// Example 2: Injecting a service instance
class LoggerService {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }
}

const loggerInstance = new LoggerService()

// Example 3: Injecting a constant value
const API_VERSION = 'v1'
const MAX_RETRIES = 3

// Register the values in the container
const container = DIContainer.getInstance()

// Register configuration
container.register('DATABASE_CONFIG', databaseConfig, 'useValue')

// Register logger instance
container.register('LOGGER', loggerInstance, 'useValue')

// Register constants
container.register('API_VERSION', API_VERSION, 'useValue')
container.register('MAX_RETRIES', MAX_RETRIES, 'useValue')

// Example usage
class DatabaseService {
  constructor(
    private config: DatabaseConfig,
    private logger: LoggerService,
    private apiVersion: string,
    private maxRetries: number,
  ) {}

  connect() {
    this.logger.log(`Connecting to database at ${this.config.host}:${this.config.port}`)
    this.logger.log(`Using API version: ${this.apiVersion}`)
    this.logger.log(`Max retries configured: ${this.maxRetries}`)
  }
}

// Usage - use getDependency instead of resolve
// Or create the service manually and inject dependencies from container
const dbService = new DatabaseService(
  container.getDependency<DatabaseConfig>('DATABASE_CONFIG'),
  container.getDependency<LoggerService>('LOGGER'),
  container.getDependency<string>('API_VERSION'),
  container.getDependency<number>('MAX_RETRIES'),
)
dbService.connect()
