import { writable } from 'svelte/store';
import splitString from 'split-string';
import type { Expander, Path, PickDeep, RecordInto, TabName, TableColumn, TableColumnType, TableRow, TypeOrKey } from './types';

// export const splitByComma = /,(?=(?:(?:[^"']*["']){2})*[^"']*$)/;

// export const splitBySpace = /\s(?=(?:(?:[^"']*["']){2})*[^"']*$)/;

export const specialChars = [
  '`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=',
  '{', '}', '[', ']', '\\', '|', ':', ';', ',', '.', '<', '>', '/', '?'
] as const;

export const specialCharsExp = /^[`!@#$%^&*()_+\-=\[\]{};:\\|,.<>\/?~]/;

const expanderTypeMap = {
  code: 'display',
  expanded: 'textarea',
  tags: 'badges'
} as Record<keyof Expander, TableColumnType>;

export const expanderKeys = Object.keys(expanderTypeMap);

const tabStore = writable('list' as TabName);

export const tab = {
  ...tabStore,
  change: (name: TabName) => tabStore.update(s => name),
};

export function log(type: 'log' | 'debug' | 'info' | 'warn' | 'error', message: any, ...messages: any[])
export function log(message: any,...messages: any[])
export function log(type?: any, message?: any, ...messages: any[]) {
  if (typeof type === 'undefined') 
    return console.log();
  const isMethod = ['log', 'error', 'warn', 'info', 'debug'].includes(type);
  if (!isMethod) {
    message = `[TEXPAND]:` + ' ' + message;
    messages.unshift(message);
    messages.unshift(type);
    type = 'log';
  }
  else {
    message = `[TEXPAND]:` + ' ' + message;
    messages.unshift(message);
  }
  console[type](...messages);
}

export function ensureArray(value: unknown, def = [] as any[]) {
  if (typeof value === 'undefined' || value === null || Array.isArray(value))
    return value || def;
  if (!Array.isArray(value))
    value = [value];
  return value;
}

export function expandersToTableRows(expanders = [] as Expander[]) {
  return expanders.map(exp => {
    const row = [] as TableColumn[];
    for (const [key, val] of Object.entries(exp)) {
      row.push({
        name: key,
        value: val,
        type: expanderTypeMap[key],
        items: [],
      } as TableColumn);
    }
    return row;
  });
}

export function tableToExpanderRows(rows: TableRow[]) {
  const newRows = [] as any[];
  rows.forEach((row) => {
    const newRow = {} as any;
    row.forEach(({ name, value }) => {
      expanderKeys.forEach((k) => {
        if (name === k) newRow[k] = value;
      });
    });
    newRows.push(newRow);
  });
  return newRows;
}

// First header should be the top level key for each item. 
function objToCSV(obj: Record<string, any>, headers = true) {
  let csv = !headers ? '' : expanderKeys.join(',');
  for (const [key, value] of Object.entries(obj)) {
    let normalValue = value;
    if (Array.isArray(value))
      normalValue = value.join(' ');
    if (value.includes(','))
      normalValue = '"' + value +'"';
    csv += '\r\n' + key + ',' + normalValue;
  }
  return csv;
}

function arrayToCSV(arr: Record<string, any>[], headers = true) {
  const keys = Object.keys(arr[0]);
  let csv = headers ? keys.join(',') : '';
  arr.forEach(v => (csv += '\r\n' + Object.values(v).map(v => {
    if (Array.isArray(v))
      v = v.join(' ');
    if (v.includes(','))
      v = '"'+ v + '"';
    return v;
  }).join(',')));
  return csv;
}

export function csvToRows(str: string) {
  const rows = str.split(/\r\n/);
  const keys = splitString(rows.shift(), { separator: ',' })
  return rows.reduce((result, cols) => {
    const split = splitString(cols, { separator: ',' });
    const row = {} as Expander;
    keys.forEach((k, i) => {
      let val = split[i] as any;
      if (val.includes(',')) {
        val = splitString(val, { separator: ',' });
        val = val.map(v => v.replace(/^("|')/, '').replace(/('|")$/, ''));
      }
      row[k] = k === 'tags' ? (val || '').split(' ') : val;
    });
    result.push(row);
    return result;
  }, [] as Expander[]);
}

export function createDownloadLink(filename: string, data: Record<string, any> | any[], type = 'csv' as 'csv' | 'json') {

  const formatted = Array.isArray(data)
    ? type === 'csv' ? arrayToCSV(data) : JSON.stringify(data, null, 2)
    : type === 'csv' ? objToCSV(data) : JSON.stringify(data, null, 2)
  const blob = new Blob([formatted], {
    type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json'
  });

  const link = document.createElement('a');
  link.style.visibility = 'hidden';

  if (window.Blob && window.URL) { // use HTML5 Blob
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
  }
  else { // use Data URI
    const url = type === 'csv'
      ? `data:application/csv;charset=utf-8,${encodeURIComponent(formatted)}`
      : `data:application/json;charset=utf-8,${encodeURIComponent(formatted)}`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank')
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

}

export function fileReader(file: File): Promise<string> {
  if (!file) return Promise.resolve(null);
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = function (e) {
      const result = e.target.result;
      const str = typeof result === 'string' ? result : String.fromCharCode.apply(null, result);
      resolve(str);
    };
    reader.readAsText(file);
    reader.onerror = (e) => reject(e);
  });

}

export function getProp<T extends Record<string, any>, P extends Path<T>>(obj: T, key: P, def?: any): PickDeep<T, Extract<P, string>> | null {
  const paths = (key as string).split('.');
  const next = paths.shift();
  let result = null;
  for (const [k, v] of Object.entries(obj)) {
    if (k === next) {
      if (paths.length && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return (getProp as any)(v, paths.join('.'), def);
      }
      else {
        if (typeof def !== 'undefined' && typeof v === 'undefined' || v === null)
          return def;
        return v;
      }
    }
  }
  if (typeof def !== 'undefined')
    return def;
  return result;
}

export function setProp<T extends Record<string, any>, P extends string, V>(obj: T, key: TypeOrKey<P>, value: V): T & RecordInto<Extract<P, string>, V> {
  const paths = (key as string).split('.');
  const next = paths.shift();
  for (const [k, v] of Object.entries(obj)) {
    if (k === next) {
      if (paths.length && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return (setProp as any)(obj[k], paths.join(), value);
      }
      else {
        obj[k as P] = value as any;
        return obj as any;
      }
    }
    else {
      if (!paths.length) {
        obj[next as P] = value as any;
        return obj as any;
      }
      else {
        const tmp = { [paths[0]]: undefined };
        obj[next as P] = (setProp as any)(tmp, paths.join(), value);
        return obj as any;
      }
    }
  }
  return obj as any;
}

export function hasProp<T extends Record<string, any>, P extends Path<T>>(obj: T, key: TypeOrKey<P>) {
  const paths = (key as string).split('.');
  const nested = paths.length > 1 ? true : false;
  const next = paths.shift();
  let result = false;
  if (!nested)
    return Object.hasOwn(obj, key);
  for (const [k, v] of Object.entries(obj)) {
    if (k === next) {
      if (paths.length && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return (hasProp as any)(v, paths.join('.'));
      }
    }
  }
  return result;
}
