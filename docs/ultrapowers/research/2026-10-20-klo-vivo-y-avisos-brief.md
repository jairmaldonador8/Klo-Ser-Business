# Research brief: Klo vivo y avisos (Web Push + cron)

Date: 2026-10-20. Stack: Next.js 16.4 App Router, Supabase cloud, Vercel Hobby, iPhone PWA installed to the home screen.

## 0. What Next 16 recommends (local docs)

From `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`:

- Use `app/manifest.ts` (`display: 'standalone'`, icons at 192 and 512). Write the service worker by hand and register it with `{ scope: '/', updateViaCache: 'none' }`.
- Send from the server with **`web-push`**: `setVapidDetails`, then `webpush.sendNotification`. The doc names no other library. Store subscriptions in the database. The doc keeps them in an in-memory variable, which is only a demo.
- In the service worker:
  - On `push`, call `event.waitUntil(self.registration.showNotification(...))`.
  - On `notificationclick`, call `clients.openWindow`.
- Serve `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate` and a strict CSP.
- For iOS users who are not in `display-mode: standalone`, show an "Add to Home Screen" hint.
- The doc mentions Serwist only for offline caching, not for push.

## 1. Web Push on iOS Safari PWAs

**Requirements**

- iOS/iPadOS **16.4 or later**, and the app must be **added to the Home Screen** from Safari. A normal Safari tab never gets push. Detect the installed app with `matchMedia('(display-mode: standalone)')`.
- A valid manifest and HTTPS.
- Call `Notification.requestPermission()` and `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` **directly inside a user gesture**, such as a button tap. Without a gesture the call is rejected.
- **Declarative Web Push** works on iOS/iPadOS **18.4 or later** for Home Screen apps, and on Safari 18.5 for macOS.
  - The payload is JSON with `"web_push": 8030` and a `notification` object containing `title`, `body`, `navigate`, `lang`, `dir`, `silent` and `app_badge`.
  - Safari shows the notification **without** a service worker. If a `push` handler exists, it can change the notification, and the declarative payload is the fallback.
  - Recommendation: send the declarative format **and** keep the classic service worker for older iOS versions. The service worker reads the same JSON.
  - Avoid `app_badge` for now. WebKit bug 296773 reports that its placement is wrong and that it can crash.

**Gotchas**

- **Silent pushes get you unsubscribed.** If the service worker gets a `push` event and does not call `showNotification` inside `waitUntil`, WebKit treats it as a silent push. After a few of those, WebKit **revokes the subscription**. Always show a notification.
- **Subscriptions expire.** Causes include reinstalling the PWA, clearing site data, long inactivity, or the user turning notifications off. Each time the app opens, call `pushManager.getSubscription()` and upsert the result on the server, keyed by `endpoint`.
- **Responses from `web.push.apple.com`:**
  - **410** means the subscription expired. Delete the row.
  - **404** also means delete the row.
  - **413** means the payload is too large.
  - **403 BadJwtToken** means the VAPID `subject` is wrong. Use a real `mailto:` address, never `localhost`.
- **A dead subscription does not always return 410.** Apple does not guarantee a prompt 410, and it sometimes returns 201 for dead subscriptions. Also delete subscriptions the client has not refreshed in N days.
- **Payload size:** the usual limit is about 4 KB after encryption. Apple publishes no number, so stay at 3 KB or less. Send the title, body and URL only, not data.
- **Headers:** Apple supports `Urgency` (very-low, low, normal, high) and `Topic`. A `Topic` is up to 32 base64url characters, and a new push with the same topic replaces the pending one.
- **EU:** Apple reversed its 2024 removal. Home Screen web apps keep push in the EU.

## 2. `web-push` (npm)

- **Version:** 3.6.7. The last npm release was in January 2024, but the repo is active (last commit 2026-09-11, not archived). The Next docs recommend it, and they name no alternative.
- **VAPID keys:** run `npx web-push generate-vapid-keys --json` once. Set these environment variables: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:...`.
- **API:** `webpush.setVapidDetails(subject, pub, priv)`, then `await webpush.sendNotification(sub, JSON.stringify(payload), { TTL, urgency, topic, headers, timeout })`.
- **Options for reminders:**
  - `TTL` is in seconds and defaults to 4 weeks. For an "event in 5 min" reminder, use about 300 to 900.
  - Use `urgency: 'high'` for time-sensitive reminders.
  - Set a `topic` per event so repeated pushes replace each other instead of piling up. This fits the "no duplicates" rule.
- **Errors:** a failed send rejects with `WebPushError`, which carries `statusCode`, `headers` and `body`. On 404 or 410, delete the subscription.
- **Runtime:** Node only, because it uses `crypto` and `https`. It does not run on Edge.

## 3. Supabase pg_cron + pg_net every minute

- **Availability:** both extensions work on every plan, including Free. Turn them on from the dashboard (Integrations, then Cron) or with `create extension pg_cron; create extension pg_net;`.
- **Minimum interval:** standard cron syntax goes down to 1 minute. pg_cron 1.5 and later also accepts intervals in seconds, such as `'30 seconds'` (1 to 59 s).
- **Supabase guidance:** run no more than 8 jobs at the same time, and keep each job under 10 minutes.
- **Free plan pausing:** Supabase pauses a Free project after 7 days of inactivity, and cron stops while it is paused. Keep the project active.
- **pg_net is asynchronous.** Responses go to `net._http_response` and are kept about 6 hours. The default timeout is 5 s; change it with `timeout_milliseconds`.

```sql
select vault.create_secret('https://klo-ser-business.vercel.app', 'app_url');
select vault.create_secret('<CRON_SECRET>', 'cron_secret');

select cron.schedule(
  'klo-avisos-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url') || '/api/cron/avisos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := jsonb_build_object('ts', now()),
    timeout_milliseconds := 10000
  ) as request_id;
  $$
);
-- GET variant: net.http_get(url := ..., headers := ...)
-- Inspect: select * from cron.job_run_details order by start_time desc limit 20;
--          select * from net._http_response order by created desc limit 20;
-- Remove:  select cron.unschedule('klo-avisos-every-minute');
```

**Route handler requirements**

- Compare the `Authorization` header with `process.env.CRON_SECRET` using a constant-time comparison. Return 401 if they do not match.
- Make the job **idempotent**: set `notified_at` in the same transaction that selects the work. Runs can overlap or repeat.

Vercel Cron on Hobby runs only once a day, which is why this plan uses pg_cron.

## 4. Next.js 16 `maxDuration` on Vercel Hobby

- In `app/api/cron/avisos/route.ts`, set:
  - `export const maxDuration = 60;` (route segment config, in seconds)
  - `export const runtime = 'nodejs'` (the default)
  - `export const dynamic = 'force-dynamic'`
- With **Fluid compute**, Hobby functions get a **300 s default and a 300 s maximum**. Fluid compute has been on by default for new projects since 2025. Pro and Enterprise get a 300 s default and an 800 s maximum.
- So 30 s or more works on Hobby. On Hobby, `maxDuration` can only lower the limit. A function that runs past the limit returns 504 `FUNCTION_INVOCATION_TIMEOUT`.
- The pg_net timeout (10 s) only stops the database from waiting. The Vercel function keeps running after that, which is fine for sending a handful of pushes.

## Sources

- Next.js 16 local docs: `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`
- WebKit:
  - Meet Declarative Web Push: https://webkit.org/?p=16535
  - Safari 18.4 features: https://webkit.org/?p=16574
  - Safari 18.5 features: https://webkit.org/?p=16923
  - Bug 296773 (`app_badge`): https://bugs.webkit.org/show_bug.cgi?id=296773
  - Bug 249766 (410 not guaranteed): https://bugs.webkit.org/show_bug.cgi?id=249766
- Apple:
  - Sending web push notifications in web apps and browsers: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
  - Developer forums (200 or 201 for dead subscriptions): https://developer.apple.com/forums/thread/719990
- Pushpad:
  - iOS requirements: https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications
  - Error 410: https://pushpad.xyz/blog/web-push-error-410-the-push-subscription-has-expired-or-the-user-has-unsubscribed
- MagicBell, PWA iOS limitations: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- web-push: https://github.com/web-push-libs/web-push (npm `web-push@3.6.7`)
- Supabase:
  - Scheduling Edge Functions: https://supabase.com/docs/guides/functions/schedule-functions
  - Cron: https://supabase.com/docs/guides/cron
  - pg_net: https://supabase.com/docs/guides/database/extensions/pg_net
- Vercel:
  - Function limits: https://vercel.com/docs/functions/limitations
  - Changelog on Fluid compute limits: https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute
