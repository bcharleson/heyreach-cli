import { campaignsListCommand } from './list.js';
import { campaignsGetCommand } from './get.js';
import { campaignsResumeCommand } from './resume.js';
import { campaignsPauseCommand } from './pause.js';
import { campaignsStartCommand } from './start.js';
import { campaignsAddLeadsCommand } from './add-leads.js';
import { campaignsStopLeadCommand } from './stop-lead.js';
import { campaignsGetLeadsCommand } from './get-leads.js';
import { campaignsGetForLeadCommand } from './get-for-lead.js';
import { campaignsCreateCommand } from './create.js';
import { campaignsUpdateSettingsCommand } from './update-settings.js';
import { campaignsUpdateSequenceCommand } from './update-sequence.js';
import { campaignsUpdateAccountsCommand } from './update-accounts.js';
import { campaignsUpdateScheduleCommand } from './update-schedule.js';
import { campaignsGetSequenceCommand } from './get-sequence.js';

export const campaignCommands = [
  campaignsListCommand,
  campaignsGetCommand,
  campaignsResumeCommand,
  campaignsPauseCommand,
  campaignsStartCommand,
  campaignsAddLeadsCommand,
  campaignsStopLeadCommand,
  campaignsGetLeadsCommand,
  campaignsGetForLeadCommand,
  campaignsCreateCommand,
  campaignsUpdateSettingsCommand,
  campaignsUpdateSequenceCommand,
  campaignsUpdateAccountsCommand,
  campaignsUpdateScheduleCommand,
  campaignsGetSequenceCommand,
];
