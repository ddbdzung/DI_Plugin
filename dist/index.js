// Register source map support for better stack traces
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("source-map-support/register");
_export_star(require("./core/core"), exports);
require("./examples/multi-tenant-scope-example");
require("./examples/scope-decorators-example");
require("./bootstrap");
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}
// Log a success message
console.log('Application started successfully with source maps enabled!') //// Uncomment to test source maps with a controlled error
 //try {
 //  testSourceMaps()
 //} catch (error) {
 //  console.error('Caught error with source maps:')
 //  console.error(error)
 //}
;

//# sourceMappingURL=index.js.map