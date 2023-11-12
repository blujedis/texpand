import type { Expander, StorageSettings } from './types';
import defaults, { updateDefaults } from './defaults';
import { writable } from 'svelte/store';
import { ensureArray } from './utils';

const store = writable({ ...defaults });

// Simply perform a get with complete settings object.
async function initStorage() {
  return setStorage({ ...defaults });
}

function getStorage<K extends keyof StorageSettings>(key: K): Promise<Record<K, StorageSettings[K]>>;
function getStorage<K extends keyof StorageSettings>(keys: K[]): Promise<Record<K, StorageSettings[K]>>;
function getStorage(defaults?: StorageSettings): Promise<StorageSettings>;
function getStorage(keysOrDefaults?: keyof StorageSettings | (keyof StorageSettings)[] | StorageSettings) {
  return chrome.storage.sync.get(keysOrDefaults);
}
async function updateStorage(key: keyof StorageSettings, value?: any, replace?: boolean): Promise<StorageSettings>;
async function updateStorage(obj: Partial<StorageSettings>, replace?: boolean): Promise<StorageSettings>;
async function updateStorage(keyOrObject: keyof StorageSettings | Partial<StorageSettings>, value?: any, replace?: boolean) {

  try {

    let current = await getStorage();

    if (typeof keyOrObject === 'object') {
      current = { ...current, ...(keyOrObject || {}) }
    }
    else if (typeof keyOrObject === 'string' && typeof value !== 'undefined') {

      const currentValue = current[keyOrObject];
      if (keyOrObject === 'expanders' && Array.isArray(currentValue)) {
        const newValue = ensureArray(value, []) as Expander[];
        const filtered = newValue.filter(exp => {
          return !currentValue.some(cExp => exp.code === cExp.code);
        });
        current[keyOrObject] = replace ? (value || []) : [...currentValue, ...filtered];
      }
      else if (typeof currentValue === 'object' && currentValue !== null) {
        current[keyOrObject] = replace ? (value || {}) : { ...currentValue, ...(value || {}) };
      }
      else {
        if (typeof value !== 'object')
          current[keyOrObject] = value;
      }
    }

    await chrome.storage.sync.set(current);
    store.update(() => current);

    return current;

  }
  catch (ex) {
    console.warn(ex.message);
    return null;
  }
}

async function setStorage(settings: StorageSettings) {
  try {
    await chrome.storage.sync.set(settings);
    store.update(() => {
      return settings;
    });
    return settings;
  }
  catch (ex) {
    console.warn(ex.message);
    return null;
  }
}

async function upgradeStorage() {
  try {
    const current = await chrome.storage.sync.get() as StorageSettings;
    const updated = updateDefaults(current);
    await setStorage(updated);
    store.update(() => {
      return updated;
    });
    return updated;
  }
  catch (ex) {
    console.warn(ex.message);
    return null;
  }
}

store.set = setStorage;

export default {
  ...store,
  init: initStorage,
  subscribe: store.subscribe,
  get: getStorage,
  set: setStorage,
  update: updateStorage,
  upgrade: upgradeStorage
};
