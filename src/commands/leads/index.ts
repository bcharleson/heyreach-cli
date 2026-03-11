import { leadsGetCommand } from './get.js';
import { leadsAddTagsCommand } from './add-tags.js';
import { leadsGetTagsCommand } from './get-tags.js';
import { leadsReplaceTagsCommand } from './replace-tags.js';

export const leadCommands = [
  leadsGetCommand,
  leadsAddTagsCommand,
  leadsGetTagsCommand,
  leadsReplaceTagsCommand,
];
