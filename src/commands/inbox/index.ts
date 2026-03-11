import { inboxListCommand } from './list.js';
import { inboxGetCommand } from './get.js';
import { inboxSendCommand } from './send.js';
import { inboxSetSeenCommand } from './set-seen.js';

export const inboxCommands = [
  inboxListCommand,
  inboxGetCommand,
  inboxSendCommand,
  inboxSetSeenCommand,
];
