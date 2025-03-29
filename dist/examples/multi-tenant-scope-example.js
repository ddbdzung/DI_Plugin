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
// Extension to DIContainer to support scopes
let ScopedDIContainer = class ScopedDIContainer {
    static getInstance() {
        if (!ScopedDIContainer._instance) {
            ScopedDIContainer._instance = new ScopedDIContainer();
        }
        return ScopedDIContainer._instance;
    }
    createScope(scopeId) {
        if (!this._scopedInstances.has(scopeId)) {
            this._scopedInstances.set(scopeId, new ScopeContainer(scopeId, this._container));
        }
        return this._scopedInstances.get(scopeId);
    }
    // Delegate methods to underlying DIContainer
    register(token, instance, type = 'useClass') {
        this._container.register(token, instance, type);
    }
    getDependency(token) {
        return this._container.getDependency(token);
    }
    constructor(){
        _define_property(this, "_scopedInstances", new Map());
        _define_property(this, "_container", void 0);
        this._container = _core.DIContainer.getInstance();
    }
};
_define_property(ScopedDIContainer, "_instance", void 0);
// Scope container for tenant-specific services
let ScopeContainer = class ScopeContainer {
    // Register a scoped service
    registerScoped(token, factory) {
        this._scopedInstances.set(token, factory(this._scopeId));
    }
    // Get a dependency - first check scoped instances, then parent container
    getDependency(token) {
        if (this._scopedInstances.has(token)) {
            return this._scopedInstances.get(token);
        }
        return this._parentContainer.getDependency(token);
    }
    // Dispose of all scoped instances
    dispose() {
        this._scopedInstances.clear();
    }
    constructor(_scopeId, _parentContainer){
        _define_property(this, "_scopeId", void 0);
        _define_property(this, "_parentContainer", void 0);
        _define_property(this, "_scopedInstances", void 0);
        this._scopeId = _scopeId;
        this._parentContainer = _parentContainer;
        this._scopedInstances = new Map();
    }
};
// Example domain services in a multi-tenant e-commerce application
// Shared services (singletons)
let PaymentGateway = class PaymentGateway {
    processPayment(amount, currency) {
        console.log(`Processing payment of ${amount} ${currency}`);
        return true;
    }
};
// Tenant-specific services that need scoping
let TenantOrderService = class TenantOrderService {
    createOrder(items) {
        console.log(`[Tenant: ${this.tenantId}] Creating order with items: ${items.join(', ')}`);
        return {
            orderId: `${this.tenantId}-${Date.now()}`,
            items
        };
    }
    processOrderPayment(orderId, amount) {
        console.log(`[Tenant: ${this.tenantId}] Processing payment for order ${orderId}`);
        return this.paymentGateway.processPayment(amount, 'USD');
    }
    constructor(tenantId, paymentGateway){
        _define_property(this, "tenantId", void 0);
        _define_property(this, "paymentGateway", void 0);
        this.tenantId = tenantId;
        this.paymentGateway = paymentGateway;
        console.log(`Creating OrderService for tenant: ${tenantId}`);
    }
};
let TenantProductCatalog = class TenantProductCatalog {
    getProducts() {
        return [
            {
                id: `${this.tenantId}-1`,
                name: 'Product 1'
            },
            {
                id: `${this.tenantId}-2`,
                name: 'Product 2'
            }
        ];
    }
    constructor(tenantId){
        _define_property(this, "tenantId", void 0);
        this.tenantId = tenantId;
        console.log(`Creating ProductCatalog for tenant: ${tenantId}`);
    }
};
// Setup the container - get singleton instance instead of using new
const container = ScopedDIContainer.getInstance();
// Register shared services as singletons
const paymentGateway = new PaymentGateway();
container.register('PAYMENT_GATEWAY', paymentGateway, 'useValue');
// Example usage with tenant scopes
function handleTenantRequest(tenantId, action) {
    console.log(`\n--- Handling request for tenant: ${tenantId} ---`);
    // Create a scope for this tenant request
    const tenantScope = container.createScope(tenantId);
    // Register tenant-specific services in this scope with explicit typing
    tenantScope.registerScoped('ORDER_SERVICE', (scopeId)=>new TenantOrderService(scopeId, tenantScope.getDependency('PAYMENT_GATEWAY')));
    tenantScope.registerScoped('PRODUCT_CATALOG', (scopeId)=>new TenantProductCatalog(scopeId));
    try {
        // Execute the tenant-specific business logic
        if (action === 'list-products') {
            const productCatalog = tenantScope.getDependency('PRODUCT_CATALOG');
            const products = productCatalog.getProducts();
            console.log(`Found ${products.length} products for tenant ${tenantId}`);
        } else if (action === 'create-order') {
            const orderService = tenantScope.getDependency('ORDER_SERVICE');
            const order = orderService.createOrder([
                'Phone',
                'Laptop'
            ]);
            orderService.processOrderPayment(order.orderId, 1299.99);
        }
    } finally{
        // Clean up the scope when the request is done
        console.log(`Disposing scope for tenant: ${tenantId}`);
        tenantScope.dispose();
    }
}
// Simulate multiple tenant requests
// Only run this example when directly executed
if (require.main === module) {
    handleTenantRequest('tenant-1', 'list-products');
    handleTenantRequest('tenant-2', 'create-order');
    handleTenantRequest('tenant-1', 'create-order');
}

//# sourceMappingURL=multi-tenant-scope-example.js.map