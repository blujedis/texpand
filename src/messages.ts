import type { Message, ReceiveHandler } from './types;
import { promise } from './utils';

const api = {

};




function send2<M extends Message>(idOrMessage: string | number | M, messageOrReceiver: M | ReceiveHandler, receiver?: ReceiveHandler) {
  let id = idOrMessage as string;
  let message: M;
  if (typeof messageOrReceiver === 'function') {
    receiver = messageOrReceiver;
    message = idOrMessage as M;
    id = undefined;
  }
  receiver = receiver || ((response: M) => { });
  if (typeof idOrMessage === 'number')
    chrome.runtime.sendMessage(id, message, receiver);
  else
    chrome.runtime.sendMessage(message, receiver);
}


function send<M extends Message, R extends Message>(
  extIdOrMessage: string,
  messageOrOptions?: chrome.runtime.MessageOptions | M,
  options?: chrome.runtime.MessageOptions,
): Promise<R> {
  let extId = extIdOrMessage + '';
  let message = messageOrOptions as M;
  if (typeof extIdOrMessage === 'object') {
    options = messageOrOptions;
    message = extIdOrMessage;
  }
  const args = [message, options] as [string | M, M | chrome.runtime.MessageOptions, chrome.runtime.MessageOptions?]
  if (typeof extId !== 'undefined')
    args.unshift(extId);

 return promise(chrome.runtime.sendMessage(...args));
}


function receive(message: Message, sender: chrome.runtime.MessageSender, send?: <M extends Message>(response?: M) => void) {
  if (message.type.startsWith('storage')) {
    // send(null);
  }
}

