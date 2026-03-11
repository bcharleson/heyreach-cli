import { webhooksCreateCommand } from './create.js';
import { webhooksGetCommand } from './get.js';
import { webhooksListCommand } from './list.js';
import { webhooksUpdateCommand } from './update.js';
import { webhooksDeleteCommand } from './delete.js';

export const webhookCommands = [
  webhooksCreateCommand,
  webhooksGetCommand,
  webhooksListCommand,
  webhooksUpdateCommand,
  webhooksDeleteCommand,
];
