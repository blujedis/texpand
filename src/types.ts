import type { SvelteHTMLElements } from 'svelte/elements';
import type { specialChars } from './utils';

export type PrimitiveValue = string | number | boolean | undefined | null;
export type HTMLTag = keyof SvelteHTMLElements; // keyof HTMLElementTagNameMap;
export type ElementProps<K extends HTMLTag> = SvelteHTMLElements[K];
export type TypeOrKey<Keys extends string | number | symbol> = Keys | (string & { value?: any });

export type ParsePath<T, Key extends keyof T> =
  Key extends string ? T[Key] extends Record<string, any>
  ? | `${Key}.${ParsePath<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
  | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
  : never
  : never;

export type ParsePathKey<T> = ParsePath<T, keyof T> | keyof T;

export type Path<T> = ParsePathKey<T> extends string | keyof T ? ParsePathKey<T> : keyof T;

// export type PathValue<T, P extends Path<T>> =
//   P extends `${infer Key}.${infer Rest}`
//   ? Key extends keyof T ? Rest extends Path<T[Key]>
//   ? PathValue<T[Key], Rest>
//   : never
//   : never
//   : P extends keyof T ? T[P]
//   : never;

export type PickDeep<
  T extends Record<string, any>,
  K extends string
> = K extends `${infer U}.${infer Rest}` ? PickDeep<T[U], Rest> : T[K];

export type RecordInto<K extends string, V> =
  K extends `${infer Key}.${infer Rest}` ?
    Rest extends string
      ? Record<Key, RecordInto<Rest, V>> 
      : Record<Key, V> 
  : Record<K, V>;

export type TableColumnType = 'input' | 'textarea' | 'display';

export interface TableColumn {
  name: string;
  type?: TableColumnType;
  value: PrimitiveValue;
}
export type TableRow = TableColumn[];

export interface TableMeta {
  source: TableRow[];
  removed: string[];
  selected: string[];
  modified: string[];
}

export type TabName = 'home' | 'add' | 'settings' | 'help';

export type SpecialChar = typeof specialChars[number];

export interface Expander {
  key: string;
  value: string;
  tags: string[];
}

export interface StorageSettings {
  active: boolean;
  settings: {
    timeout: number;
    casesensitive: boolean;
    prefixKey: SpecialChar;
    enableKey: SpecialChar;
    disableKey: SpecialChar;
  }
  expanders: Expander[];
};

export interface Message {
  type?: 'storage';
  payload: any;
}