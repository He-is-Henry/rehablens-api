// src/audit/audit-notification.formatter.ts

import { AuditAction } from './audit-action.enum';

export type AuditParty = {
  userId: string;
  name: string;
  role: string;
  customId?: string;
};

export type AuditLogEntry = {
  action: AuditAction;
  actor: AuditParty;
  object?: { id?: string; name: string; type: string };
  affected?: AuditParty[];
  outcome?: 'success' | 'failure';
};

export type NotificationPayload = {
  title: string;
  body: string;
};

type NotificationFormatterFn = (
  log: AuditLogEntry,
  targetUserId: string,
) => NotificationPayload | null;

const formatParty = (p: AuditParty) =>
  p.customId ? `${p.name} (${p.customId})` : p.name;

const isActor = (log: AuditLogEntry, uid?: string) =>
  Boolean(uid && log.actor.userId === uid);

const isTarget = (party?: AuditParty, uid?: string) =>
  Boolean(uid && party?.userId === uid);

const isSelfAction = (log: AuditLogEntry) =>
  !log.affected?.length ||
  (log.affected.length === 1 && log.affected[0].userId === log.actor.userId);

const getActor = (log: AuditLogEntry, targetUserId: string) =>
  isActor(log, targetUserId) ? 'You' : formatParty(log.actor);

const getAffected = (log: AuditLogEntry, targetUserId: string) => {
  if (isSelfAction(log) || !log.affected) return '';

  const names = log.affected.map((a) => {
    if (isTarget(a, targetUserId)) return 'you';
    if (a.userId === log.actor.userId) return 'themselves';
    return formatParty(a);
  });

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};

// Map action to specific titles and body formatters
const NOTIFICATION_MAP: Partial<Record<AuditAction, NotificationFormatterFn>> =
  {
    [AuditAction.LOGIN]: (log, targetUserId) => {
      if (log.outcome === 'failure') return null; // Don't notify external devices on failed logins unless desired
      return {
        title: 'Security Alert',
        body: `A new sign-in was detected for ${getActor(log, targetUserId)}.`,
      };
    },

    [AuditAction.PASSWORD_RESET]: (log, targetUserId) => ({
      title: 'Security Alert',
      body:
        log.outcome === 'failure'
          ? 'Failed password reset attempt on your account.'
          : `${getActor(log, targetUserId)} reset your password.`,
    }),

    [AuditAction.ASSIGNMENT_CREATED]: (log, targetUserId) => ({
      title: 'New Exercise Assigned',
      body: `${getActor(log, targetUserId)} assigned an exercise to ${getAffected(log, targetUserId)}${
        log.object ? ` (${log.object.name})` : ''
      }.`,
    }),

    [AuditAction.ASSIGNMENT_UPDATED]: (log, targetUserId) => ({
      title: 'Assignment Updated',
      body: `${getActor(log, targetUserId)} updated an assignment for ${getAffected(log, targetUserId)}${
        log.object ? ` (${log.object.name})` : ''
      }.`,
    }),

    [AuditAction.ASSIGNMENT_DELETED]: (log, targetUserId) => ({
      title: 'Assignment Removed',
      body: `${getActor(log, targetUserId)} removed an assignment for ${getAffected(log, targetUserId)}${
        log.object ? ` (${log.object.name})` : ''
      }.`,
    }),

    [AuditAction.SCHEDULE_CREATED]: (log, targetUserId) => ({
      title: 'Session Scheduled',
      body: `${getActor(log, targetUserId)} scheduled sessions for ${getAffected(log, targetUserId)}.`,
    }),

    [AuditAction.SCHEDULE_CANCELLED]: (log, targetUserId) => ({
      title: 'Session Cancelled',
      body: `${getActor(log, targetUserId)} cancelled a scheduled session for ${getAffected(log, targetUserId)}.`,
    }),

    [AuditAction.STAFF_ASSIGNED]: (log, targetUserId) => ({
      title: 'New Physiotherapist Assigned',
      body: `${getActor(log, targetUserId)} assigned ${log.object?.name ?? 'a physiotherapist'} to ${getAffected(log, targetUserId)}.`,
    }),

    [AuditAction.PATIENT_LINKED]: (log, targetUserId) => ({
      title: 'Hospital Link Updated',
      body: `${getActor(log, targetUserId)} linked ${getAffected(log, targetUserId)} to ${log.object?.name ?? 'the hospital'}.`,
    }),

    [AuditAction.PATIENT_VERIFIED]: (log, targetUserId) => ({
      title: 'Account Verified',
      body: `${getActor(log, targetUserId)} verified your account status.`,
    }),
  };

/**
 * Renders unified Title and Body payload for push notifications.
 * Returns null if the action does not require a push alert.
 */
export function renderAuditNotification(
  log: AuditLogEntry,
  targetUserId: string,
): NotificationPayload | null {
  const formatter = NOTIFICATION_MAP[log.action];
  if (!formatter) return null;

  return formatter(log, targetUserId);
}
