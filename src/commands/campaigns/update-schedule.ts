import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const campaignsUpdateScheduleCommand: CommandDefinition = {
  name: 'campaigns_update_schedule',
  group: 'campaigns',
  subcommand: 'update-schedule',
  description: 'Replace the schedule of a campaign (daily window, days, timezone, optional start/end dates). SCHEDULED campaigns revert to DRAFT. Not allowed on ACTIVE or COMPLETED. startDate is locked after the campaign has started once.',
  examples: [
    'heyreach campaigns update-schedule --campaign-id 123 --schedule-json \'{"dailyStartTime":"09:00:00","dailyEndTime":"17:00:00","timeZoneId":"America/New_York"}\'',
    'heyreach campaigns update-schedule --campaign-id 123 --schedule-json \'{"dailyStartTime":"08:00:00","dailyEndTime":"18:00:00","timeZoneId":"Europe/London","enabledSaturday":true,"startDate":"2025-06-01","endDate":"2025-07-01"}\'',
  ],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    scheduleJson: z.string().describe('CampaignScheduleApiDto JSON — daily window, days, timezone, optional start/end dates'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'scheduleJson', flags: '--schedule-json <json>', description: 'CampaignScheduleApiDto JSON' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/UpdateSchedule' },
  fieldMappings: { campaignId: 'body', scheduleJson: 'body' },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      campaignId: input.campaignId,
      schedule: JSON.parse(input.scheduleJson as string),
    };
    return client.request({ method: 'POST', path: '/campaign/UpdateSchedule', body });
  },
};

