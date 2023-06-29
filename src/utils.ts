import { writable } from 'svelte/store';
import type { Path, PickDeep, PrimitiveValue, RecordDeepSingle, TabName, TableColumnType, TableRow, TypeOrKey } from './types';
import defaults from './defaults';

const splitExp = /,(?=(?:(?:[^"']*["']){2})*[^"']*$)/;

export const specialChars = [
  '`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=',
  '{', '}', '[', ']', '\\', '|', ':', ';', ',', '.', '<', '>', '/', '?'
] as const;

export const specialCharsExp = /^[`!@#$%^&*()_+\-=\[\]{};:\\|,.<>\/?~]/;


const tabStore = writable('home' as TabName);

export const tab = {
  ...tabStore,
  change: (name: TabName) => tabStore.update(s => name),
};

export function log(type?: 'log' | 'warn' | 'error' | 'debug', ...message: any[]) {
  console[type](...message);
}

export function expandersToRows(obj: Record<string, any>) {
  return Object.entries(obj).reduce((a, [key, value]) => {
    const row = [
      { name: 'key', value: key, type: 'display' as TableColumnType },
      { name: 'value', value: value, type: 'textarea' as TableColumnType },
    ];
    a.push(row);
    return a;
  }, [] as TableRow[]);
}

export function rowToExpandersObject(rows: TableRow[]) {
  const obj = {} as Record<string, PrimitiveValue>;
  rows.forEach(r => {
    const [k, v] = r;
    obj[k.value + ''] = v.value
  });
  return obj;
}

// First header should be the top level key for each item. 
function objToCSV(obj: Record<string, any>, headers?: string[] | null) {
  if (typeof headers === 'undefined')
    headers = ['code', 'expanded'];
  let csv = !headers ? '' : headers.join(',');
  for (const [key, value] of Object.entries(obj)) {
    let normalValue = value;
    if (value.includes(','))
      normalValue = '"' + value + '"';
    csv += '\r\n' + key + ',' + normalValue;
  }
  return csv;
}

function arrayToCSV(arr: Record<string, any>[], headers = true) {
  const keys = Object.keys(arr[0]);
  let csv = headers ? keys.join(',') : '';
  arr.forEach(v => (csv += '\r\n' + Object.values(v).map(v => {
    if (v.includes(','))
      v = "'" + v + "'";
    return v;
  }).join(',')));
  return csv;
}

export function csvToObj(str: string, headers = true) {
  const rows = str.split(/\r\n/);
  const header = headers ? rows.shift() : rows;
  const obj = {} as Record<string, string>;
  rows.forEach(row => {
    const cols = row.split(splitExp);
    obj[cols[0]] = cols[1];
  });
  return obj;
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

export function setProp<T extends Record<string, any>, P extends Path<T>, V>(obj: T, key: TypeOrKey<P>, value: any): T & RecordDeepSingle<Extract<P, string>, V> {
  const paths = (key as string).split('.');
  const next = paths.shift();
  for (const [k, v] of Object.entries(obj)) {
    if (k === next) {
      if (paths.length && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return (setProp as any)(obj[k], paths.join(), value);
      }
      else {
        obj[k as P] = value;
        return obj as any;
      }
    }
    else {
      if (!paths.length) {
        obj[next as P] = value;
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

const tmp = setProp(defaults, 'settings.other', 'temp')

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
