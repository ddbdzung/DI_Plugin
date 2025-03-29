// Register source map support for better stack traces
import 'source-map-support/register'

// Export main modules
export * from './core/core'

// Import example files, but don't execute them automatically
import './examples/multi-tenant-scope-example'
// Import but don't execute the decorator example
import './examples/scope-decorators-example'

// Main app entry point
import './bootstrap'

// Import error test
import { testSourceMaps } from './error-test'

// Log a success message
console.log('Application started successfully with source maps enabled!')

//// Uncomment to test source maps with a controlled error
//try {
//  testSourceMaps()
//} catch (error) {
//  console.error('Caught error with source maps:')
//  console.error(error)
//}
