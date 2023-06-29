import type { SpecialChar, StorageSettings } from 'src/types';
import Storage from 'src/storage';

let cache: StorageSettings;
let keys = [] as string[];
let prefixes = [] as string[];
let active = false;
let buffer = '';
let timeoutid: NodeJS.Timeout;

function hasPrefix(key: string) {
  if (!prefixes.length) {
    // if (!keys.length) keys = KEY_VALUES.map(v => v.key);
    if (!keys.length)
      keys = Object.keys(cache.expanders);
    if (!cache.settings.casesensitive)
      keys = keys.map(k => k.toLowerCase())
    if (!prefixes.length) prefixes = keys.reduce((a, c) => {
      const prefix = c.charAt(0);
      if (!a.includes(prefix))
        a = [...a, prefix]
      return a;
    }, [] as string[]);
  }
  return prefixes.includes(key.charAt(0));
}

function hasMatch(key: string) {
  if (!keys.length) keys = Object.keys(cache.expanders);
  if (!cache.settings.casesensitive) {
    keys = keys.map(k => k.toLowerCase())
    key = key.toLowerCase();
  }
  return keys.includes(key);
}

function setActivity(value: boolean) {
  return Storage.update({ active: value }).then(s => {
    console.log('[TEXPAND]:', value ? 'active' : 'inactive');
  });
}

function initTimeout() {
  // -1 do nothing
  // 0 set active status to false
  // > than 0 set active status to false upon expired time.
  if (typeof cache.settings.timeout !== 'number' || cache.settings.timeout === -1)
    return;

  if (cache.settings.timeout) {
    timeoutid = setTimeout(() => {
      active = false;
      setActivity(false);
    }, cache.settings.timeout);
  }
  else {
    active = false;
    setActivity(false);
  }

}

function replaceText({ e, buffer, value, lastChar }: { e: KeyboardEvent, buffer: string, value: string, lastChar: string }) {
  const el = e.target as HTMLElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const currentValue = el.value + lastChar;
    e.preventDefault();
    setTimeout(() => {
      el.value = currentValue.replace(buffer, value);
      initTimeout();
    });
  }
}

function handleKeypress(e: KeyboardEvent) {
  if (active) {
    if (hasPrefix(buffer) || hasPrefix(e.key)) {
      clearTimeout(timeoutid);
      buffer += e.key;
      if (hasMatch(buffer)) {
        const value = cache.expanders[buffer];
        replaceText({ e, buffer, value, lastChar: e.key });
        buffer = ''; // reset the buffer.
      }
    }
    else {
      buffer = '';
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!active && e.repeat) return;
  if (active && e.key === 'Backspace')
    buffer = buffer.slice(0, -1);
  else if (!active && e.ctrlKey && cache.settings.enableKey === e.key) {
    active = true;
    setActivity(true);
    initTimeout();
  }
  else if (active && e.ctrlKey && cache.settings.disableKey === e.key) {
    setActivity(false);
    clearTimeout(timeoutid);
  }
}

function handleStorageChanged(changes: Record<keyof StorageSettings, chrome.storage.StorageChange>, area: 'sync' | 'local' | 'managed' | 'session' | 'help') {
  if (area === 'sync') {
    if (changes.expanders?.newValue) {
      cache.expanders = changes.expanders.newValue;
    }
    else if (changes.settings?.newValue) {
      cache.settings = changes.settings.newValue;
    }
  }
}


function bindEvents() {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keypress', handleKeypress);
  chrome.storage.onChanged.addListener(handleStorageChanged);
  chrome.runtime.onSuspend.addListener(unbindEvents);
}

function unbindEvents() {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('keypress', handleKeypress);
  chrome.storage.onChanged.removeListener(handleStorageChanged);
}

function init() {
  unbindEvents();
  if (!cache)
    Storage.get().then(s => {
      console.log('[TEXPAND]: init');
      (cache = s as StorageSettings);
      bindEvents();
    });
  else
    bindEvents();
}

init();

