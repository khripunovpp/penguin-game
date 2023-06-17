type Factory<T = unknown> = (...args: any) => T;

/**
 * Singleton class for dependency injection service
 */
export class Di {
  static container: Di;
  private registry: Map<Symbol, Factory> = new Map();

  constructor() {
    if (Di.container) {
      return Di.container;
    }
    Di.container = this;
  }

  register<T>(
    key: Symbol,
    value: Factory<T>,
  ) {
    this.registry.set(key, value);
  }

  get<T>(
    key: Symbol,
  ): Factory<T> {
    return this.registry.get(key) as Factory<T>;
  }

}