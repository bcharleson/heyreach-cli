import { orgApiKeysCommand } from './api-keys.js';
import { orgCreateApiKeyCommand } from './create-api-key.js';
import { orgWorkspacesCommand } from './workspaces.js';
import { orgCreateWorkspaceCommand } from './create-workspace.js';
import { orgUpdateWorkspaceCommand } from './update-workspace.js';
import { orgUsersCommand } from './users.js';
import { orgGetUserCommand } from './get-user.js';
import { orgWorkspaceUsersCommand } from './workspace-users.js';
import { orgInviteAdminsCommand } from './invite-admins.js';
import { orgInviteMembersCommand } from './invite-members.js';
import { orgInviteManagersCommand } from './invite-managers.js';

export const orgCommands = [
  orgApiKeysCommand,
  orgCreateApiKeyCommand,
  orgWorkspacesCommand,
  orgCreateWorkspaceCommand,
  orgUpdateWorkspaceCommand,
  orgUsersCommand,
  orgGetUserCommand,
  orgWorkspaceUsersCommand,
  orgInviteAdminsCommand,
  orgInviteMembersCommand,
  orgInviteManagersCommand,
];
