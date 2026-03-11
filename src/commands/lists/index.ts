import { listsGetCommand } from './get.js';
import { listsListCommand } from './list.js';
import { listsCreateCommand } from './create.js';
import { listsGetLeadsCommand } from './get-leads.js';
import { listsAddLeadsCommand } from './add-leads.js';
import { listsDeleteLeadsCommand } from './delete-leads.js';
import { listsDeleteLeadsByUrlCommand } from './delete-leads-by-url.js';
import { listsGetCompaniesCommand } from './get-companies.js';
import { listsGetForLeadCommand } from './get-for-lead.js';

export const listCommands = [
  listsGetCommand,
  listsListCommand,
  listsCreateCommand,
  listsGetLeadsCommand,
  listsAddLeadsCommand,
  listsDeleteLeadsCommand,
  listsDeleteLeadsByUrlCommand,
  listsGetCompaniesCommand,
  listsGetForLeadCommand,
];
