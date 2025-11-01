export type CamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<CamelCase<Tail>>}`
    : S;

export type Camelize<T> = T extends Date
  ? T
  : T extends Array<infer U>
    ? Camelize<U>[]
    : T extends Record<string, unknown>
      ? {
          [K in keyof T as CamelCase<K & string>]: Camelize<T[K]>;
        }
      : T;

const toCamelCaseKey = (value: string) =>
  value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

export const convertKeysToCamelCase = <T>(input: T): Camelize<T> => {
  if (input === null || input === undefined) {
    return input as Camelize<T>;
  }

  if (Array.isArray(input)) {
    return input.map((item) => convertKeysToCamelCase(item)) as Camelize<T>;
  }

  if (input instanceof Date) {
    return input as Camelize<T>;
  }

  if (typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>);
    const result: Record<string, unknown> = {};

    for (const [key, value] of entries) {
      const camelKey = toCamelCaseKey(key);
      result[camelKey] = convertKeysToCamelCase(value);
    }

    return result as Camelize<T>;
  }

  return input as Camelize<T>;
};
