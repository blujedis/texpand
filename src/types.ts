import type { SvelteHTMLElements } from 'svelte/elements';
import type { specialChars } from './utils';

export type PrimitiveValueBase = string | number | boolean;
export type PrimitiveValue = PrimitiveValueBase | PrimitiveValueBase[] | undefined | null;
export type HTMLTag = keyof SvelteHTMLElements; // keyof HTMLElementTagNameMap;
export type ElementProps<K extends HTMLTag> = SvelteHTMLElements[K];
export type TypeOrKey<Keys extends string | number | symbol> = Keys | (string & { value?: any });
export type PromiseReturnType<T> = T extends Promise<infer R> ? R : never;

export type ParsePath<T, Key extends keyof T> =
  Key extends string ? T[Key] extends Record<string, any>
  ? | `${Key}.${ParsePath<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
  | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
  : never
  : never;

export type ParsePathKey<T> = ParsePath<T, keyof T> | keyof T;

export type Path<T> = ParsePathKey<T> extends string | keyof T ? ParsePathKey<T> : keyof T;

export type PickDeep<
  T extends Record<string, any>,
  K extends string
> = K extends `${infer U}.${infer Rest}` ? PickDeep<T[U], Rest> : T[K];

export type RecordInto<K extends string | keyof Record<string, any>, V> =
  K extends `${infer Key}.${infer Rest}` ?
  Rest extends string
  ? Record<Key, RecordInto<Rest, V>>
  : Record<Key, V>
  : Record<K, V>;

export type TableColumnType = 'display' | 'input' | 'textarea' | 'badges' |  'select' | 'select.multiple';

export interface TableColumn {
  name: string;
  type?: TableColumnType;
  value: any;
  items: { value: string | number, label?: string }[];
  formatter?: (value: any) => any;
}
export type TableRow = TableColumn[];

export type TableHeader = { label: string; name: string };

export interface TableMeta {
  removed: number;
  modified: number;
}

export type TabName = 'list' | 'add' | 'settings' | 'help';

export type SpecialChar = typeof specialChars[number];

export interface Expander {
  code: string;
  expanded: string;
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
  type?: 'storage' | 'log' | 'ping';
  payload?: any;
}

export type ReceiveHandler = (response: Message) => void;