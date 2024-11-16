export type Modify<T, R> = Omit<T, keyof R> & R;

// see https://rbardini.com/making-optional-properties-nullable-typescript/
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

// type PickRequired<T> = Pick<T, RequiredKeys<T>>;

// type PickOptional<T> = Pick<T, OptionalKeys<T>>;

// type Nullable<T> = { [P in keyof T]: T[P] | null };

// type NullableOptional<T> = PickRequired<T> & Nullable<PickOptional<T>>;

type RequiredFieldPatchOperation = "update";
type OptionalFieldPatchOperation = RequiredFieldPatchOperation | "remove";

export type Patchable<T> = Partial<
  {
    [K in OptionalKeys<T>]: {
      op: OptionalFieldPatchOperation;
      value?: T[K];
    };
  } & {
    [K in RequiredKeys<T>]: {
      op: RequiredFieldPatchOperation;
      value: T[K];
    };
  }
>;

// Definitions for `Object.entries`
// see https://stackoverflow.com/a/73913412
// lifted from type-fest:
// see https://github.com/sindresorhus/type-fest/blob/9fe122b970fb49343ca22d5e08107979ec4ae9aa/source/entry.d.ts
// see https://github.com/sindresorhus/type-fest/blob/9fe122b970fb49343ca22d5e08107979ec4ae9aa/source/entries.d.ts
// consider importing the library after upgrading TypeScript to >=5.1
type MapKey<BaseType> =
  BaseType extends Map<infer KeyType, unknown> ? KeyType : never;
type MapValue<BaseType> =
  BaseType extends Map<unknown, infer ValueType> ? ValueType : never;
type ArrayEntry<BaseType extends readonly unknown[]> = [
  number,
  BaseType[number],
];
type MapEntry<BaseType> = [MapKey<BaseType>, MapValue<BaseType>];
type ObjectEntry<BaseType> = [keyof BaseType, BaseType[keyof BaseType]];
type SetEntry<BaseType> =
  BaseType extends Set<infer ItemType> ? [ItemType, ItemType] : never;
// type Entry<BaseType> =
// 	BaseType extends Map<unknown, unknown> ? MapEntry<BaseType>
// 		: BaseType extends Set<unknown> ? SetEntry<BaseType>
// 			: BaseType extends readonly unknown[] ? ArrayEntry<BaseType>
// 				: BaseType extends object ? ObjectEntry<BaseType>
// 					: never;
type ArrayEntries<BaseType extends readonly unknown[]> = Array<
  ArrayEntry<BaseType>
>;
type MapEntries<BaseType> = Array<MapEntry<BaseType>>;
type ObjectEntries<BaseType> = Array<ObjectEntry<BaseType>>;
type SetEntries<BaseType extends Set<unknown>> = Array<SetEntry<BaseType>>;
export type Entries<BaseType> =
  BaseType extends Map<unknown, unknown>
    ? MapEntries<BaseType>
    : BaseType extends Set<unknown>
      ? SetEntries<BaseType>
      : BaseType extends readonly unknown[]
        ? ArrayEntries<BaseType>
        : BaseType extends object
          ? ObjectEntries<BaseType>
          : never;
