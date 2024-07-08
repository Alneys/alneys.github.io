declare type ToType<K, T> = { [P in keyof K]: T };
declare type AddUndefined<T> = { [P in keyof T]: T[P] | undefined };
