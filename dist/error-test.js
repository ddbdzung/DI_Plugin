// Import source-map-support first
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "testSourceMaps", {
    enumerable: true,
    get: function() {
        return testSourceMaps;
    }
});
require("source-map-support/register");
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
// A class with a method that will throw an error
let ErrorTester = class ErrorTester {
    throwError() {
        // Create a multi-line function to have a meaningful stack trace
        const innerFunction = ()=>{
            const deeperFunction = ()=>{
                console.log(`About to throw an error from ${this.name}`);
                throw new Error(`Test error from ${this.name} - TypeScript source maps should point to this line`);
            };
            return deeperFunction();
        };
        return innerFunction();
    }
    constructor(name){
        _define_property(this, "name", void 0);
        this.name = name;
    }
};
function testSourceMaps() {
    const tester = new ErrorTester('SourceMapTest');
    return tester.throwError();
}

//# sourceMappingURL=error-test.js.map