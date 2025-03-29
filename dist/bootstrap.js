"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("module-alias/register");
require("source-map-support/register");
require("reflect-metadata");
// Print banner to indicate application start
console.log('Application bootstrapped successfully');
const gracefulShutdown = async (err)=>{
    try {
        // eslint-disable-next-line no-console
        console.error('Fatal error occurred:', err);
        // Add your cleanup logic here
        // For example: Close database connections, finish processing queues, etc.
        // Exit with error code
        process.exit(1);
    } catch (shutdownErr) {
        // eslint-disable-next-line no-console
        console.error('Error during graceful shutdown:', shutdownErr);
        process.exit(1);
    }
};
// Handle uncaught exceptions
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('uncaughtException', async (err)=>{
    await gracefulShutdown(err);
});
// Handle unhandled promise rejections
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('unhandledRejection', async (err)=>{
    if (err instanceof Error) {
        await gracefulShutdown(err);
    } else {
        await gracefulShutdown(new Error(String(err)));
    }
});
// Handle shutdown signals
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGTERM', async ()=>{
    // eslint-disable-next-line no-console
    console.info('SIGTERM signal received');
    await gracefulShutdown(new Error('SIGTERM received'));
});
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGINT', async ()=>{
    // eslint-disable-next-line no-console
    console.info('SIGINT signal received');
    await gracefulShutdown(new Error('SIGINT received'));
});

//# sourceMappingURL=bootstrap.js.map