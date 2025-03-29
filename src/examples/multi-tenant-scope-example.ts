import { DIContainer, InjectType } from '../core/core'

// Extension to DIContainer to support scopes
class ScopedDIContainer {
  private _scopedInstances = new Map<string, ScopeContainer>()
  private _container: DIContainer
  private static _instance: ScopedDIContainer

  private constructor() {
    this._container = DIContainer.getInstance()
  }

  public static getInstance(): ScopedDIContainer {
    if (!ScopedDIContainer._instance) {
      ScopedDIContainer._instance = new ScopedDIContainer()
    }
    return ScopedDIContainer._instance
  }

  public createScope(scopeId: string): ScopeContainer {
    if (!this._scopedInstances.has(scopeId)) {
      this._scopedInstances.set(scopeId, new ScopeContainer(scopeId, this._container))
    }
    return this._scopedInstances.get(scopeId)!
  }

  // Delegate methods to underlying DIContainer
  public register<T>(token: string, instance: T, type: InjectType = 'useClass'): void {
    this._container.register(token, instance, type)
  }

  public getDependency<T>(token: string): T {
    return this._container.getDependency<T>(token)
  }
}

// Scope container for tenant-specific services
class ScopeContainer {
  private _scopedInstances = new Map<string, any>()

  constructor(
    private _scopeId: string,
    private _parentContainer: DIContainer,
  ) {}

  // Register a scoped service
  registerScoped<T>(token: string, factory: (scopeId: string) => T): void {
    this._scopedInstances.set(token, factory(this._scopeId))
  }

  // Get a dependency - first check scoped instances, then parent container
  getDependency<T>(token: string): T {
    if (this._scopedInstances.has(token)) {
      return this._scopedInstances.get(token)
    }

    return this._parentContainer.getDependency<T>(token)
  }

  // Dispose of all scoped instances
  dispose(): void {
    this._scopedInstances.clear()
  }
}

// Example domain services in a multi-tenant e-commerce application

// Shared services (singletons)
class PaymentGateway {
  processPayment(amount: number, currency: string) {
    console.log(`Processing payment of ${amount} ${currency}`)
    return true
  }
}

// Tenant-specific services that need scoping
class TenantOrderService {
  constructor(
    private tenantId: string,
    private paymentGateway: PaymentGateway,
  ) {
    console.log(`Creating OrderService for tenant: ${tenantId}`)
  }

  createOrder(items: string[]) {
    console.log(`[Tenant: ${this.tenantId}] Creating order with items: ${items.join(', ')}`)
    return { orderId: `${this.tenantId}-${Date.now()}`, items }
  }

  processOrderPayment(orderId: string, amount: number) {
    console.log(`[Tenant: ${this.tenantId}] Processing payment for order ${orderId}`)
    return this.paymentGateway.processPayment(amount, 'USD')
  }
}

class TenantProductCatalog {
  constructor(private tenantId: string) {
    console.log(`Creating ProductCatalog for tenant: ${tenantId}`)
  }

  getProducts() {
    return [
      { id: `${this.tenantId}-1`, name: 'Product 1' },
      { id: `${this.tenantId}-2`, name: 'Product 2' },
    ]
  }
}

// Setup the container - get singleton instance instead of using new
const container = ScopedDIContainer.getInstance()

// Register shared services as singletons
const paymentGateway = new PaymentGateway()
container.register('PAYMENT_GATEWAY', paymentGateway, 'useValue')

// Example usage with tenant scopes
function handleTenantRequest(tenantId: string, action: string) {
  console.log(`\n--- Handling request for tenant: ${tenantId} ---`)

  // Create a scope for this tenant request
  const tenantScope = container.createScope(tenantId)

  // Register tenant-specific services in this scope with explicit typing
  tenantScope.registerScoped<TenantOrderService>(
    'ORDER_SERVICE',
    (scopeId: string) =>
      new TenantOrderService(scopeId, tenantScope.getDependency('PAYMENT_GATEWAY')),
  )

  tenantScope.registerScoped<TenantProductCatalog>(
    'PRODUCT_CATALOG',
    (scopeId: string) => new TenantProductCatalog(scopeId),
  )

  try {
    // Execute the tenant-specific business logic
    if (action === 'list-products') {
      const productCatalog = tenantScope.getDependency<TenantProductCatalog>('PRODUCT_CATALOG')
      const products = productCatalog.getProducts()
      console.log(`Found ${products.length} products for tenant ${tenantId}`)
    } else if (action === 'create-order') {
      const orderService = tenantScope.getDependency<TenantOrderService>('ORDER_SERVICE')
      const order = orderService.createOrder(['Phone', 'Laptop'])
      orderService.processOrderPayment(order.orderId, 1299.99)
    }
  } finally {
    // Clean up the scope when the request is done
    console.log(`Disposing scope for tenant: ${tenantId}`)
    tenantScope.dispose()
  }
}

// Simulate multiple tenant requests
// Only run this example when directly executed
if (require.main === module) {
  handleTenantRequest('tenant-1', 'list-products')
  handleTenantRequest('tenant-2', 'create-order')
  handleTenantRequest('tenant-1', 'create-order')
}
