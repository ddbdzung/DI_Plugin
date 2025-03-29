import { createHash } from 'crypto'
import { uid } from 'uid/secure'

export type InjectionToken = string | symbol
export type Ctr<T = any> = new (...args: any[]) => T
export type InjectType = 'useClass' | 'useValue' | 'useFactory'
export type IdentifierType = Ctr

/**
 * This class is used to identify the injection token
 */
class InjectionIdentifier {
  private _id: string
  private _token: InjectionToken
  private _type: InjectType
  private _identifier: any
  private _boundTarget?: Ctr

  private _generateId() {
    return uid(21)
  }

  private _generateToken(id: string, identifier: Ctr) {
    return createHash('sha256').update(`${id}_${identifier.name}`).digest('hex')
  }

  constructor(identifier: Ctr, type: InjectType = 'useClass') {
    this._id = this._generateId()
    this._type = type

    switch (type) {
      case 'useClass':
        this._token = this._generateToken(this._id, identifier)
        this._identifier = identifier
        break
      case 'useValue':
        this._token = this._generateToken(this._id, identifier)
        this._identifier = identifier
        break
      case 'useFactory':
        this._token = this._generateToken(this._id, identifier)
        this._identifier = identifier
        break
    }

    return this
  }

  public get id() {
    return this._id
  }

  public get token() {
    return this._token
  }

  public get type() {
    return this._type
  }

  public get identifier() {
    return this._identifier
  }

  public get boundTarget() {
    return this._boundTarget
  }

  public bindTo(target: Ctr) {
    this._boundTarget = target
    return this
  }
}

export class DIContainer {
  private _container = new Map<InjectionToken, any>()

  // Make constructor protected so it can only be instantiated via getInstance
  protected constructor() {
    // Protected constructor to prevent direct instantiation
  }

  public getDependency<T>(token: InjectionToken): T {
    const instance = this._container.get(token)
    if (!instance) {
      throw new Error(`No dependency found for token: ${String(token)}`)
    }
    return instance as T
  }

  public register<T>(token: InjectionToken, instance: T, type: InjectType = 'useClass'): void {
    this._container.set(token, instance)
  }

  public resolve<T>(target: new (...args: any[]) => T): T {
    return new target()
  }

  private static _instance: DIContainer

  public static getInstance(): DIContainer {
    if (!DIContainer._instance) {
      DIContainer._instance = new DIContainer()
    }

    return DIContainer._instance
  }
}
