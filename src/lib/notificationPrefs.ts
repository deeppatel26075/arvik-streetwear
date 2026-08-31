// MISSING BACKEND INTEGRATION: there is no notification_preferences table or
// profiles column in the current schema (see supabase/migrations/), so these
// settings persist to localStorage per-device rather than the customer's
// account. Swap the two functions below for real reads/writes once a
// `notification_preferences` table (or profile columns) exists — nothing
// else in the Notifications page needs to change.

export interface NotificationPrefs {
  orderConfirmation: boolean;
  shippingUpdates: boolean;
  deliveryUpdates: boolean;
  newDrops: boolean;
  offersPromotions: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  orderConfirmation: true,
  shippingUpdates: true,
  deliveryUpdates: true,
  newDrops: true,
  offersPromotions: false,
};

const STORAGE_KEY = 'arviik_notification_prefs';

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Best-effort only — storage may be unavailable (private mode, quota).
  }
}
