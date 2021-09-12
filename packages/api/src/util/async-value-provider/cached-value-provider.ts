import { AsyncValueProvider } from './async-value-provider';

export interface CachedValueProviderOptions<T> {
  readonly valueProvider: AsyncValueProvider<T>;
}

export class CachedValueProvider<T> implements AsyncValueProvider<T> {
  private value?: T;
  private valueProvider: AsyncValueProvider<T>;

  constructor(options: CachedValueProviderOptions<T>) {
    this.valueProvider = options.valueProvider;
  }

  async provide(): Promise<T> {
    if (this.value === undefined) {
      console.log('Caching the value');
      this.value = await this.valueProvider.provide();
    } else {
      console.log('Using cached value');
    }

    return this.value;
  }
}
