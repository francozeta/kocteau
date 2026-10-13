# Notifications

## Entry Points

- Route: `app/(main)/notifications`; surface: `notifications-inbox.tsx`.
- Indicator/list: `notifications-button.tsx`, `notification-list.tsx`.
- State: `hooks/use-notifications.ts`; APIs: `app/api/notifications`.

## Preserve

Inbox and unread counts belong to the viewer. Authorize read/read-all actions on
the server and keep counts consistent with the list. See [data boundaries](../../../../docs/core-architecture.md).

## Check

Run tests, lint, and the web build. Check empty/unread/read states, read-all,
destination links, optimistic rollback, keyboard use, and the mobile inbox.
