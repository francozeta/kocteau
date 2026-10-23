import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../../../..");
const requireApp = createRequire(resolve(root, "apps/web/package.json"));
const { createClient } = requireApp("@supabase/supabase-js");
const { createServerClient } = requireApp("@supabase/ssr");
const cfg = JSON.parse(execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
  cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
}));
assert.equal(new URL(cfg.API_URL).href, "http://127.0.0.1:54321/");
const label = execFileSync("docker", ["inspect", "--format",
  '{{index .Config.Labels "com.supabase.cli.project"}}', "supabase_db_kocteau"], { encoding: "utf8" }).trim();
assert.equal(label, "kocteau", "only the local Kocteau Docker database is allowed");
const marker = "kocteau-feed-read-fixture";
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(cfg.API_URL, cfg.SECRET_KEY || cfg.SERVICE_ROLE_KEY, options);
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
function sql(query) {
  const out = execFileSync("docker", ["exec", "-i", "supabase_db_kocteau", "psql",
    "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-q"],
  { input: query, encoding: "utf8" }).trim();
  return out ? JSON.parse(out) : null;
}
async function checked(promise) {
  const result = await promise;
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

const existing = (await checked(admin.auth.admin.listUsers({ perPage: 1000 }))).users;
const accounts = [];
for (const suffix of ["a", "b"]) {
  const email = "feed-read-fixture-" + suffix + "@example.invalid";
  const password = "LocalFeedFixture_" + randomUUID();
  let user = existing.find(row => row.email === email);
  if (user) {
    assert.equal(user.app_metadata?.fixture, marker, "refusing to change an unmarked account");
    await checked(admin.auth.admin.updateUserById(user.id, { password, email_confirm: true }));
  } else {
    user = (await checked(admin.auth.admin.createUser({
      email, password, email_confirm: true, app_metadata: { fixture: marker },
    }))).user;
  }
  sql("INSERT INTO public.profiles(id,username,display_name,onboarded,taste_onboarded) VALUES (" +
    quote(user.id) + "," + quote("feed_read_fixture_" + suffix) + "," +
    quote("Local fixture " + suffix) + ",true,true) ON CONFLICT(id) DO UPDATE SET onboarded=true,taste_onboarded=true");
  const client = createClient(cfg.API_URL, cfg.PUBLISHABLE_KEY || cfg.ANON_KEY, options);
  const { session } = await checked(client.auth.signInWithPassword({ email, password }));
  const cookies = [];
  const ssr = createServerClient(cfg.API_URL, cfg.PUBLISHABLE_KEY || cfg.ANON_KEY, {
    cookies: { getAll: () => [], setAll: values => cookies.push(...values) },
  });
  await checked(ssr.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }));
  accounts.push({ id: user.id, cookie: cookies.map(c => c.name + "=" + c.value).join("; ") });
}
const entities = sql("WITH inserted AS (INSERT INTO public.entities(provider,provider_id,type,title,artist_name) VALUES " +
  Array.from({ length: 12 }, (_, n) => "('deezer'," + quote(999100001 + n) +
    ",'track'," + quote("Local fixture track " + (n + 1)) + ",'Local fixture artist')").join(",") +
  " ON CONFLICT(provider,provider_id,type) DO UPDATE SET title=excluded.title RETURNING id,provider_id) SELECT json_agg(inserted) FROM inserted");
entities.sort((a, b) => a.provider_id.localeCompare(b.provider_id));
const reviews = sql("WITH inserted AS (INSERT INTO public.reviews(author_id,entity_id,rating,title,body) VALUES " +
  entities.map((entity, n) => "(" + quote(accounts[n % 2].id) + "," + quote(entity.id) +
    ",4," + quote("Local fixture review " + (n + 1)) + ",'Disposable local feed fixture.')").join(",") +
  " ON CONFLICT(author_id,entity_id) DO UPDATE SET title=excluded.title RETURNING id,author_id,entity_id) SELECT json_agg(inserted) FROM inserted");
sql("INSERT INTO auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) " +
  "SELECT ('920000'||lpad(n::text,2,'0')||'-0000-4000-8000-000000000000')::uuid,'authenticated','authenticated'," +
  "'feed-read-writer-'||n||'@example.invalid','',now(),'{\"fixture\":\"kocteau-feed-read-fixture\"}','{}',now(),now() " +
  "FROM generate_series(1,8)n ON CONFLICT(id)DO NOTHING; " +
  "INSERT INTO public.profiles(id,username,onboarded,taste_onboarded) SELECT id,'feed_read_writer_'||substr(id::text,7,2),true,true " +
  "FROM auth.users WHERE raw_app_meta_data->>'fixture'=" + quote(marker) + " AND id::text LIKE '920000__-0000-4000-8000-000000000000' ON CONFLICT(id)DO NOTHING; " +
  "INSERT INTO public.reviews(author_id,entity_id,rating,title,body,created_at) SELECT p.id,e.id,4,'Local fixture writer review','Disposable pagination fixture.',now()-interval '1 hour' " +
  "FROM public.profiles p CROSS JOIN public.entities e WHERE p.username LIKE 'feed_read_writer_%' AND e.provider='deezer' " +
  "AND e.provider_id::text BETWEEN '999100001' AND '999100012' ON CONFLICT(author_id,entity_id)DO NOTHING; " +
  "UPDATE public.reviews SET title=null,body=null WHERE id=" + quote(reviews[0].id));
// These marked local actors have one deterministic private-state fixture per run.
const viewerIds = accounts.map(account => quote(account.id)).join(",");
sql("DELETE FROM public.review_likes WHERE user_id IN (" + viewerIds +
  "); DELETE FROM public.review_bookmarks WHERE user_id IN (" + viewerIds + ")");
const first = await fetch("http://127.0.0.1:3001/api/feed?view=for-you", { headers: { Cookie: accounts[0].cookie } });
assert.equal(first.status, 200, "start the baseline app on port 3001 before seeding");
const { feed } = await first.json();
const privateTarget = feed.find(row => row.author?.id !== accounts[0].id)?.id;
assert(privateTarget, "a peer review must be visible on the first page");
sql("INSERT INTO public.review_likes(user_id,review_id) VALUES (" + quote(accounts[0].id) + "," + quote(privateTarget) +
  ") ON CONFLICT DO NOTHING; INSERT INTO public.review_bookmarks(user_id,review_id) VALUES (" +
  quote(accounts[0].id) + "," + quote(privateTarget) + ") ON CONFLICT DO NOTHING");
const privateDir = resolve(root, ".codex-private/feed");
mkdirSync(privateDir, { recursive: true, mode: 0o700 });
chmodSync(privateDir, 0o700);
writeFileSync(resolve(privateDir, "fixture.json"), JSON.stringify({ accounts, privateTarget }), { mode: 0o600 });
chmodSync(resolve(privateDir, "fixture.json"), 0o600);
console.log(JSON.stringify({ loginAccounts: accounts.length, fixtureProfiles: 10, fixtureReviews: 108, sessionFile: ".codex-private/feed/fixture.json" }));
