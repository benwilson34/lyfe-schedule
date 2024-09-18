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
