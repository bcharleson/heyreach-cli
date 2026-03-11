import { campaignsListCommand } from './list.js';
import { campaignsGetCommand } from './get.js';
import { campaignsResumeCommand } from './resume.js';
import { campaignsPauseCommand } from './pause.js';
import { campaignsAddLeadsCommand } from './add-leads.js';
import { campaignsStopLeadCommand } from './stop-lead.js';
import { campaignsGetLeadsCommand } from './get-leads.js';
import { campaignsGetForLeadCommand } from './get-for-lead.js';

export const campaignCommands = [
  campaignsListCommand,
  campaignsGetCommand,
  campaignsResumeCommand,
  campaignsPauseCommand,
  campaignsAddLeadsCommand,
  campaignsStopLeadCommand,
  campaignsGetLeadsCommand,
  campaignsGetForLeadCommand,
];
