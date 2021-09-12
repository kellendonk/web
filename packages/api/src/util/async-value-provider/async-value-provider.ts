export interface AsyncValueProvider<T> {
  provide(): Promise<T>;
}
