import 'reflect-metadata'
import 'source-map-support/register' // Register source-map-support at the entry point
import { DIContainer } from '../core/core'

// Lifetime options for dependencies
enum Lifetime {
  Singleton, // One instance for the entire application
  Scoped, // One instance per scope (e.g., per tenant/request)
  Transient, // New instance every time
}

// Metadata keys
const INJECT_METADATA_KEY = 'inject:dependencies'
const LIFETIME_METADATA_KEY = 'inject:lifetime'

// Service decorator that marks a class as injectable
function Service(lifetime: Lifetime = Lifetime.Singleton) {
  return function (target: any) {
    Reflect.defineMetadata(LIFETIME_METADATA_KEY, lifetime, target)
    return target
  }
}

// Inject decorator for constructor parameters
function Inject(token: string) {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const existingInjectParams: Map<number, string> =
      Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map<number, string>()

    existingInjectParams.set(parameterIndex, token)
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectParams, target)
  }
}

// Decorator for tenant ID injection
function InjectTenantId() {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const existingInjectParams: Map<number, string> =
      Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map<number, string>()

    existingInjectParams.set(parameterIndex, '__TENANT_ID__')
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectParams, target)
  }
}

// Rather than extending DIContainer, create our own implementation
// since the current DIContainer may not be properly exported as a class
class EnhancedDIContainer {
  private _singletons = new Map<string, any>()
  private static _instance: EnhancedDIContainer

  public static getInstance(): EnhancedDIContainer {
    if (!EnhancedDIContainer._instance) {
      EnhancedDIContainer._instance = new EnhancedDIContainer()
    }
    return EnhancedDIContainer._instance
  }

  public createScope(tenantId: string): ScopeContainer {
    return new ScopeContainer(tenantId, this)
  }

  public register<T>(token: string, target: any, lifetime: Lifetime = Lifetime.Singleton): void {
    this._singletons.set(token, { target, lifetime })
  }

  public getDependency<T>(token: string): T {
    if (token === '__TENANT_ID__') {
      throw new Error('Tenant ID can only be resolved within a scope')
    }

    const registration = this._singletons.get(token)
    if (!registration) {
      throw new Error(`No registration for token: ${token}`)
    }

    if (registration.lifetime !== Lifetime.Singleton) {
      throw new Error(`Cannot resolve non-singleton dependency outside of scope: ${token}`)
    }

    // Create the singleton if it doesn't exist
    if (!registration.instance) {
      registration.instance = this.createInstance(registration.target)
    }

    return registration.instance as T
  }

  private createInstance<T>(target: any): T {
    // Get constructor parameters
    const injectMetadata: Map<number, string> =
      Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map<number, string>()

    // Resolve dependencies
    const deps = []
    for (let i = 0; i < target.length; i++) {
      const token = injectMetadata.get(i)
      if (token) {
        deps.push(this.getDependency(token))
      } else {
        deps.push(undefined)
      }
    }

    return new target(...deps)
  }
}

class ScopeContainer {
  private _scopedInstances = new Map<string, any>()

  constructor(
    private _tenantId: string,
    private _parentContainer: EnhancedDIContainer,
  ) {}

  getDependency<T>(token: string): T {
    // Special case for tenant ID
    if (token === '__TENANT_ID__') {
      return this._tenantId as unknown as T
    }

    // Check if we already have an instance in this scope
    if (this._scopedInstances.has(token)) {
      return this._scopedInstances.get(token) as T
    }

    // Check parent container
    try {
      return this._parentContainer.getDependency<T>(token)
    } catch (error) {
      // If the error is that we need a scope, then we'll create the instance
      const registration = this._parentContainer['_singletons'].get(token)
      if (!registration) {
        throw new Error(`No registration for token: ${token}`)
      }

      // Create and cache an instance if it's scoped
      if (registration.lifetime === Lifetime.Scoped) {
        const instance = this.createInstance(registration.target) as T
        this._scopedInstances.set(token, instance)
        return instance
      }

      // For transient, create but don't cache
      if (registration.lifetime === Lifetime.Transient) {
        return this.createInstance(registration.target) as T
      }

      throw error
    }
  }

  private createInstance<T>(target: any): T {
    // Get constructor parameters
    const injectMetadata: Map<number, string> =
      Reflect.getOwnMetadata(INJECT_METADATA_KEY, target) || new Map<number, string>()

    // Resolve dependencies
    const deps = []
    for (let i = 0; i < target.length; i++) {
      const token = injectMetadata.get(i)
      if (token) {
        deps.push(this.getDependency(token))
      } else {
        deps.push(undefined)
      }
    }

    return new target(...deps)
  }

  dispose(): void {
    this._scopedInstances.clear()
  }
}

// Example usage with decorators

// Singleton service (shared across tenants)
@Service(Lifetime.Singleton)
class PaymentGateway {
  processPayment(orderId: string, amount: number): boolean {
    console.log(`Processing payment of ${amount} for order ${orderId}`)
    return true
  }
}

// Scoped service (one per tenant)
@Service(Lifetime.Scoped)
class OrderService {
  constructor(
    @InjectTenantId() private tenantId: string,
    @Inject('PAYMENT_GATEWAY') private paymentGateway: PaymentGateway,
  ) {
    console.log(`Created OrderService for tenant: ${tenantId}`)
  }

  createOrder(items: string[]) {
    const orderId = `${this.tenantId}-${Date.now()}`
    console.log(
      `[Tenant: ${this.tenantId}] Creating order ${orderId} with items: ${items.join(', ')}`,
    )
    return { orderId, items }
  }

  processOrder(orderId: string, amount: number) {
    console.log(`[Tenant: ${this.tenantId}] Processing order ${orderId}`)
    return this.paymentGateway.processPayment(orderId, amount)
  }
}

// Transient service (new instance each time)
@Service(Lifetime.Transient)
class ShoppingCart {
  private items: string[] = []

  constructor(@InjectTenantId() private tenantId: string) {
    console.log(`Created new ShoppingCart for tenant: ${tenantId}`)
  }

  addItem(item: string) {
    this.items.push(item)
    console.log(
      `[Tenant: ${this.tenantId}] Added ${item} to cart, total items: ${this.items.length}`,
    )
  }

  getItems() {
    return [...this.items]
  }
}

// Example function to run the demo
export function runDecoratorExample() {
  // Initialize the container
  const container = EnhancedDIContainer.getInstance()

  // Register services
  container.register('PAYMENT_GATEWAY', PaymentGateway)
  container.register('ORDER_SERVICE', OrderService, Lifetime.Scoped)
  container.register('SHOPPING_CART', ShoppingCart, Lifetime.Transient)

  // Simulate requests from different tenants
  processTenantRequest('tenant-1')
  processTenantRequest('tenant-2')
  processTenantRequest('tenant-1')
}

// Example multi-tenant usage
function processTenantRequest(tenantId: string) {
  console.log(`\n--- Request from tenant: ${tenantId} ---`)

  // Create a scope for this tenant
  const scope = EnhancedDIContainer.getInstance().createScope(tenantId)

  try {
    // Get services (scoped and transient)
    const orderService = scope.getDependency<OrderService>('ORDER_SERVICE')

    // Each call to get a transient service creates a new instance
    const cart1 = scope.getDependency<ShoppingCart>('SHOPPING_CART')
    cart1.addItem('Phone')

    const cart2 = scope.getDependency<ShoppingCart>('SHOPPING_CART')
    cart2.addItem('Laptop')

    // Demonstrate that cart1 and cart2 are different instances
    console.log(
      `Cart 1 items: ${cart1.getItems().length}, Cart 2 items: ${cart2.getItems().length}`,
    )

    // Use the scoped OrderService
    const order = orderService.createOrder(['Phone', 'Laptop'])
    orderService.processOrder(order.orderId, 1299.99)
  } finally {
    // Clean up scope when request is complete
    scope.dispose()
    console.log(`Disposed scope for tenant: ${tenantId}`)
  }
}

// Only run the example if this file is being executed directly
if (require.main === module) {
  runDecoratorExample()
}
