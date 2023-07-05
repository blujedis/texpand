import type { Expander, Message, StorageSettings } from 'src/types';
import Storage from 'src/storage';

let cache: StorageSettings;
let buffer = '';
let timeoutid: NodeJS.Timeout;

function getPrefixesAndKeys() {
  const keys = cache.expanders.map(exp => exp.code);
  const prefixes = keys.reduce((a, c) => {
    const prefix = c.charAt(0);
    if (!a.includes(prefix))
      a = [...a, prefix]
    return a;
  }, [] as string[]);
  return { keys, prefixes };
}

function hasPrefix(key: string) {
  const { prefixes } = getPrefixesAndKeys();
  return prefixes.includes(key.charAt(0));
}

function hasMatch(key: string) {
  let lowered = [] as string[];
  if (!cache.settings.casesensitive) {
    const { keys } = getPrefixesAndKeys();
    lowered = keys.map(k => k.toLowerCase())
    key = key.toLowerCase();
  }
  return lowered.includes(key);
}

function setActivity(value: boolean) {
  return Storage.update('active', value).then(s => {
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
      cache.active = false;
      setActivity(false);
    }, cache.settings.timeout);
  }
  else {
    cache.active = false;
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
  if (cache.active) {
    if (hasPrefix(buffer) || hasPrefix(e.key)) {
      buffer += e.key;
      clearTimeout(timeoutid);
      if (hasMatch(buffer)) {
        const obj = cache.expanders.find(exp => exp.code === buffer) as Expander;
        replaceText({ e, buffer, value: obj.expanded, lastChar: e.key });
        buffer = ''; // reset the buffer.
      }
    }
    else {
      buffer = '';
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!cache.active && e.repeat) return;
  if (cache.active && e.key === 'Backspace')
    buffer = buffer.slice(0, -1);
  else if (!cache.active && e.ctrlKey && cache.settings.enableKey === e.key) {
    setActivity(true);
    initTimeout();
  }
  else if (cache.active && e.ctrlKey && cache.settings.disableKey === e.key) {
    setActivity(false);
    clearTimeout(timeoutid);
  }
}

function handleStorageChanged(changes: Record<keyof StorageSettings, chrome.storage.StorageChange>, area: 'sync' | 'local' | 'managed' | 'session' | 'help') {
  if (area === 'sync') {
    if (changes.expanders?.newValue) {
      cache.expanders = changes.expanders.newValue;
    }
    if (changes.settings?.newValue) {
      cache.settings = changes.settings.newValue;
    }
    if (changes.active?.newValue) {
      cache.active = changes.active.newValue;
    }
  }
}

function handleMessage(message: Message, sender: chrome.runtime.MessageSender, send?: (response?: any) => void) {
  // if (msg.text === 'are_you_there_content_script?') {
  //   sendResponse({status: "yes"});
  // }
  
}

function bindEvents() {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keypress', handleKeypress);
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

});
  chrome.storage.onChanged.addListener(handleStorageChanged);
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

