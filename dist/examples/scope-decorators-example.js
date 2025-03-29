"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "runDecoratorExample", {
    enumerable: true,
    get: function() {
        return runDecoratorExample;
    }
});
require("reflect-metadata");
require("source-map-support/register" // Register source-map-support at the entry point
);
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
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
// Lifetime options for dependencies
var Lifetime = /*#__PURE__*/ function(Lifetime) {
    Lifetime[Lifetime["Singleton"] = 0] = "Singleton";
    Lifetime[Lifetime["Scoped"] = 1] = "Scoped";
    Lifetime[Lifetime["Transient"] = 2] = "Transient";
    return Lifetime;
}(Lifetime || {});
// Metadata keys
const INJECT_METADATA_KEY = 'inject:dependencies';
const LIFETIME_METADATA_KEY = 'inject:lifetime';
// Service decorator that marks a class as injectable
function Service(lifetime = 0) {
    return function(target) {
        Reflect.defineMetadata(LIFETIME_METADATA_KEY, lifetime, target);
        return target;
    };
}
// Inject decorator for constructor parameters
function Inject(token) {
    return function(target, propertyKey, parameterIndex) {
        const existingInjectParams = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map();
        existingInjectParams.set(parameterIndex, token);
        Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectParams, target);
    };
}
// Decorator for tenant ID injection
function InjectTenantId() {
    return function(target, propertyKey, parameterIndex) {
        const existingInjectParams = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map();
        existingInjectParams.set(parameterIndex, '__TENANT_ID__');
        Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectParams, target);
    };
}
// Rather than extending DIContainer, create our own implementation
// since the current DIContainer may not be properly exported as a class
let EnhancedDIContainer = class EnhancedDIContainer {
    static getInstance() {
        if (!EnhancedDIContainer._instance) {
            EnhancedDIContainer._instance = new EnhancedDIContainer();
        }
        return EnhancedDIContainer._instance;
    }
    createScope(tenantId) {
        return new ScopeContainer(tenantId, this);
    }
    register(token, target, lifetime = 0) {
        this._singletons.set(token, {
            target,
            lifetime
        });
    }
    getDependency(token) {
        if (token === '__TENANT_ID__') {
            throw new Error('Tenant ID can only be resolved within a scope');
        }
        const registration = this._singletons.get(token);
        if (!registration) {
            throw new Error(`No registration for token: ${token}`);
        }
        if (registration.lifetime !== 0) {
            throw new Error(`Cannot resolve non-singleton dependency outside of scope: ${token}`);
        }
        // Create the singleton if it doesn't exist
        if (!registration.instance) {
            registration.instance = this.createInstance(registration.target);
        }
        return registration.instance;
    }
    createInstance(target) {
        // Get constructor parameters
        const injectMetadata = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map();
        // Resolve dependencies
        const deps = [];
        for(let i = 0; i < target.length; i++){
            const token = injectMetadata.get(i);
            if (token) {
                deps.push(this.getDependency(token));
            } else {
                deps.push(undefined);
            }
        }
        return new target(...deps);
    }
    constructor(){
        _define_property(this, "_singletons", new Map());
    }
};
_define_property(EnhancedDIContainer, "_instance", void 0);
let ScopeContainer = class ScopeContainer {
    getDependency(token) {
        // Special case for tenant ID
        if (token === '__TENANT_ID__') {
            return this._tenantId;
        }
        // Check if we already have an instance in this scope
        if (this._scopedInstances.has(token)) {
            return this._scopedInstances.get(token);
        }
        // Check parent container
        try {
            return this._parentContainer.getDependency(token);
        } catch (error) {
            // If the error is that we need a scope, then we'll create the instance
            const registration = this._parentContainer['_singletons'].get(token);
            if (!registration) {
                throw new Error(`No registration for token: ${token}`);
            }
            // Create and cache an instance if it's scoped
            if (registration.lifetime === 1) {
                const instance = this.createInstance(registration.target);
                this._scopedInstances.set(token, instance);
                return instance;
            }
            // For transient, create but don't cache
            if (registration.lifetime === 2) {
                return this.createInstance(registration.target);
            }
            throw error;
        }
    }
    createInstance(target) {
        // Get constructor parameters
        const injectMetadata = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map();
        // Resolve dependencies
        const deps = [];
        for(let i = 0; i < target.length; i++){
            const token = injectMetadata.get(i);
            if (token) {
                deps.push(this.getDependency(token));
            } else {
                deps.push(undefined);
            }
        }
        return new target(...deps);
    }
    dispose() {
        this._scopedInstances.clear();
    }
    constructor(_tenantId, _parentContainer){
        _define_property(this, "_tenantId", void 0);
        _define_property(this, "_parentContainer", void 0);
        _define_property(this, "_scopedInstances", void 0);
        this._tenantId = _tenantId;
        this._parentContainer = _parentContainer;
        this._scopedInstances = new Map();
    }
};
// Example usage with decorators
// Singleton service (shared across tenants)
let PaymentGateway = class PaymentGateway {
    processPayment(orderId, amount) {
        console.log(`Processing payment of ${amount} for order ${orderId}`);
        return true;
    }
};
PaymentGateway = _ts_decorate([
    Service(0)
], PaymentGateway);
// Scoped service (one per tenant)
let OrderService = class OrderService {
    createOrder(items) {
        const orderId = `${this.tenantId}-${Date.now()}`;
        console.log(`[Tenant: ${this.tenantId}] Creating order ${orderId} with items: ${items.join(', ')}`);
        return {
            orderId,
            items
        };
    }
    processOrder(orderId, amount) {
        console.log(`[Tenant: ${this.tenantId}] Processing order ${orderId}`);
        return this.paymentGateway.processPayment(orderId, amount);
    }
    constructor(tenantId, paymentGateway){
        _define_property(this, "tenantId", void 0);
        _define_property(this, "paymentGateway", void 0);
        this.tenantId = tenantId;
        this.paymentGateway = paymentGateway;
        console.log(`Created OrderService for tenant: ${tenantId}`);
    }
};
OrderService = _ts_decorate([
    Service(1),
    _ts_param(0, InjectTenantId()),
    _ts_param(1, Inject('PAYMENT_GATEWAY')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof PaymentGateway === "undefined" ? Object : PaymentGateway
    ])
], OrderService);
// Transient service (new instance each time)
let ShoppingCart = class ShoppingCart {
    addItem(item) {
        this.items.push(item);
        console.log(`[Tenant: ${this.tenantId}] Added ${item} to cart, total items: ${this.items.length}`);
    }
    getItems() {
        return [
            ...this.items
        ];
    }
    constructor(tenantId){
        _define_property(this, "tenantId", void 0);
        _define_property(this, "items", void 0);
        this.tenantId = tenantId;
        this.items = [];
        console.log(`Created new ShoppingCart for tenant: ${tenantId}`);
    }
};
ShoppingCart = _ts_decorate([
    Service(2),
    _ts_param(0, InjectTenantId()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ])
], ShoppingCart);
function runDecoratorExample() {
    // Initialize the container
    const container = EnhancedDIContainer.getInstance();
    // Register services
    container.register('PAYMENT_GATEWAY', PaymentGateway);
    container.register('ORDER_SERVICE', OrderService, 1);
    container.register('SHOPPING_CART', ShoppingCart, 2);
    // Simulate requests from different tenants
    processTenantRequest('tenant-1');
    processTenantRequest('tenant-2');
    processTenantRequest('tenant-1');
}
// Example multi-tenant usage
function processTenantRequest(tenantId) {
    console.log(`\n--- Request from tenant: ${tenantId} ---`);
    // Create a scope for this tenant
    const scope = EnhancedDIContainer.getInstance().createScope(tenantId);
    try {
        // Get services (scoped and transient)
        const orderService = scope.getDependency('ORDER_SERVICE');
        // Each call to get a transient service creates a new instance
        const cart1 = scope.getDependency('SHOPPING_CART');
        cart1.addItem('Phone');
        const cart2 = scope.getDependency('SHOPPING_CART');
        cart2.addItem('Laptop');
        // Demonstrate that cart1 and cart2 are different instances
        console.log(`Cart 1 items: ${cart1.getItems().length}, Cart 2 items: ${cart2.getItems().length}`);
        // Use the scoped OrderService
        const order = orderService.createOrder([
            'Phone',
            'Laptop'
        ]);
        orderService.processOrder(order.orderId, 1299.99);
    } finally{
        // Clean up scope when request is complete
        scope.dispose();
        console.log(`Disposed scope for tenant: ${tenantId}`);
    }
}
// Only run the example if this file is being executed directly
if (require.main === module) {
    runDecoratorExample();
}

//# sourceMappingURL=scope-decorators-example.js.map