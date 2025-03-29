"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DIContainer", {
    enumerable: true,
    get: function() {
        return DIContainer;
    }
});
const _crypto = require("crypto");
const _secure = require("uid/secure");
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
/**
 * This class is used to identify the injection token
 */ let InjectionIdentifier = class InjectionIdentifier {
    _generateId() {
        return (0, _secure.uid)(21);
    }
    _generateToken(id, identifier) {
        return (0, _crypto.createHash)('sha256').update(`${id}_${identifier.name}`).digest('hex');
    }
    get id() {
        return this._id;
    }
    get token() {
        return this._token;
    }
    get type() {
        return this._type;
    }
    get identifier() {
        return this._identifier;
    }
    get boundTarget() {
        return this._boundTarget;
    }
    bindTo(target) {
        this._boundTarget = target;
        return this;
    }
    constructor(identifier, type = 'useClass'){
        _define_property(this, "_id", void 0);
        _define_property(this, "_token", void 0);
        _define_property(this, "_type", void 0);
        _define_property(this, "_identifier", void 0);
        _define_property(this, "_boundTarget", void 0);
        this._id = this._generateId();
        this._type = type;
        switch(type){
            case 'useClass':
                this._token = this._generateToken(this._id, identifier);
                this._identifier = identifier;
                break;
            case 'useValue':
                this._token = this._generateToken(this._id, identifier);
                this._identifier = identifier;
                break;
            case 'useFactory':
                this._token = this._generateToken(this._id, identifier);
                this._identifier = identifier;
                break;
        }
        return this;
    }
};
let DIContainer = class DIContainer {
    getDependency(token) {
        const instance = this._container.get(token);
        if (!instance) {
            throw new Error(`No dependency found for token: ${String(token)}`);
        }
        return instance;
    }
    register(token, instance, type = 'useClass') {
        this._container.set(token, instance);
    }
    resolve(target) {
        return new target();
    }
    static getInstance() {
        if (!DIContainer._instance) {
            DIContainer._instance = new DIContainer();
        }
        return DIContainer._instance;
    }
    // Make constructor protected so it can only be instantiated via getInstance
    constructor(){
        _define_property(this, "_container", new Map());
    // Protected constructor to prevent direct instantiation
    }
};
_define_property(DIContainer, "_instance", void 0);

//# sourceMappingURL=core.js.map