import type { SvelteHTMLElements } from 'svelte/elements';
import type { specialChars } from './utils';

export type PrimitiveValue = string | number | boolean | undefined | null;
export type HTMLTag = keyof SvelteHTMLElements; // keyof HTMLElementTagNameMap;
export type ElementProps<K extends HTMLTag> = SvelteHTMLElements[K];
export type TypeOrKey<Keys extends string | number | symbol> = Keys | (string & { value?: any });

export type TableColumnType = 'input' | 'textarea' | 'display';

export type TableColumn = {
  name: string;
  type?: TableColumnType;
  value: PrimitiveValue;
}
export type TableRow = TableColumn[];

export type TableMeta = {
  source: TableRow[];
  removed: string[];
  selected: string[];
  modified: string[];
}

export type TabName = 'home' | 'add' | 'settings' | 'help';

export type SpecialChar = typeof specialChars[number];

export type StorageSettings = {
  active: boolean;
  settings: {
    timeout: number;
    casesensitive: boolean;
    prefixKey: SpecialChar;
    enableKey: SpecialChar;
    disableKey: SpecialChar;
  }
  expanders: Record<string, string>;
};
