import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tracks = Number(process.env.STARTER_BENCH_TRACKS ?? 129);
const collections = Number(process.env.STARTER_BENCH_COLLECTIONS ?? 1);
if (!Number.isInteger(tracks) || tracks < 24 || tracks > 10000 ||
    !Number.isInteger(collections) || collections < 1 || collections > 3) {
  throw new Error("Use 24–10000 tracks and 1–3 collections.");
}
const docker = ["--host=unix:///var/run/docker.sock"];
const container = "supabase_db_kocteau";
const project = execFileSync("docker", [...docker, "inspect", "-f",
  '{{ index .Config.Labels "com.supabase.cli.project" }}', container], { encoding: "utf8" }).trim();
if (project !== "kocteau") throw new Error("Expected the local Kocteau Docker database.");
const before = readFileSync(resolve(root, "supabase/migrations/20260618101534_starter_source_rotation_lane.sql"), "utf8");
const after = readFileSync(resolve(root, "supabase/migrations/20261025203107_starter_late_hydration.sql"), "utf8");
function definition(text) {
  return text.slice(text.indexOf("CREATE OR REPLACE FUNCTION"), text.indexOf("\n$$;") + 4);
}
function expanded(text) {
  return text.split("AS $$\n")[1].split("\n$$;")[0]
    .replaceAll("p_limit", "6").replaceAll("p_surface", "'home'::text")
    .replaceAll("p_context_key", "'home'::text")
    .replaceAll("p_exclude_provider_ids", "'{}'::text[]");
}
const viewerA = "61000000-0000-4000-8000-000000000001";
const viewerB = "61000000-0000-4000-8000-000000000002";
const seed = `
update public.starter_tracks set is_active=false;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'authenticated','authenticated',email,now(),'{}','{}',now(),now()
from(values('${viewerA}'::uuid,'starter-plan-a@example.invalid'),('${viewerB}'::uuid,'starter-plan-b@example.invalid'))v(id,email);
insert into public.profiles(id,username,onboarded,taste_onboarded)
values('${viewerA}','starter_plan_a',true,true),('${viewerB}','starter_plan_b',true,true);
insert into public.preference_tags(id,kind,slug,label)
select md5('starter-bench-tag:'||g)::uuid,'genre','starter-bench-tag-'||g,'Starter bench tag '||g from generate_series(1,8)g;
insert into public.user_preference_tags(user_id,tag_id,weight,source)
select '${viewerA}',md5('starter-bench-tag:'||g)::uuid,0.5+g::numeric/10,'onboarding' from generate_series(1,8)g;
insert into public.user_preference_tags(user_id,tag_id,weight,source)
values('${viewerA}',md5('starter-bench-tag:1')::uuid,0.4,'inferred');
insert into public.starter_tracks(id,provider_id,title,artist_name,cover_url,prompt,editorial_note,is_active,is_featured,sort_order,created_at)
select md5('starter-bench-track:'||g)::uuid,'starter-bench-track-'||g,'Starter bench track '||g,'Local fixture artist '||(g%80),
'https://example.invalid/'||repeat('cover-',15)||g,repeat('Local prompt. ',8),repeat('Local editorial note. ',12),true,g%7=0,g,
'2026-10-01'::timestamptz+g*interval '1 second' from generate_series(1,${tracks})g;
insert into public.starter_track_tags(starter_track_id,tag_id,weight)
select md5('starter-bench-track:'||g)::uuid,md5('starter-bench-tag:'||t)::uuid,0.5+(t%3)::numeric/4
from generate_series(1,${tracks})g cross join generate_series(1,6)t;
insert into public.editorial_collections(id,slug,title,is_published,sort_order)
select md5('starter-bench-collection:'||g)::uuid,'starter-bench-collection-'||g,'Local fixture collection '||g,g<3,g
from generate_series(1,${collections})g;
insert into public.editorial_collection_items(collection_id,starter_track_id,position)
select md5('starter-bench-collection:'||c)::uuid,md5('starter-bench-track:'||g)::uuid,g
from generate_series(1,${tracks})g cross join generate_series(1,${collections})c;
insert into public.starter_sources(id,provider,provider_source_id,title,url,is_active)
values(md5('starter-bench-source')::uuid,'apple_music','starter-bench-source','Local fixture source','https://example.invalid/local-source',true);
insert into public.starter_source_items(source_id,source_item_id,source_position,title,starter_track_id,status,last_seen_at)
select md5('starter-bench-source')::uuid,'local-source-'||g,g,'Local source item '||g,md5('starter-bench-track:'||g)::uuid,
'synced','2026-10-01' from generate_series(1,(${tracks}*0.7)::integer)g;
insert into public.entities(id,type,provider,provider_id,title)
values(md5('starter-bench-entity:1')::uuid,'track','deezer','starter-bench-track-1','Starter bench track 1');
insert into public.reviews(id,author_id,entity_id,rating,body)
values(md5('starter-bench-review:1')::uuid,'${viewerA}',md5('starter-bench-entity:1')::uuid,4,'Local benchmark review');
analyze public.starter_tracks;
analyze public.starter_track_tags;
analyze public.editorial_collection_items;
analyze public.editorial_collections;
analyze public.starter_source_items;
analyze public.starter_sources;
analyze public.user_preference_tags;
`;
const quote = (value) => value === null ? "NULL" : "'" + value.replaceAll("'", "''") + "'";
const cases = [];
for (const viewer of [viewerA, viewerB, null]) {
  for (const surface of ["home","search","track","profile","review","saved","activity","studio","notifications"]) {
    cases.push({ viewer, surface, context: surface, limit: 6, exclude: "'{}'::text[]" });
  }
}
for (const limit of [null, 0, -1, 1, 12, 99]) {
  cases.push({ viewer: viewerA, surface: "home", context: null, limit, exclude: "'{}'::text[]" });
}
cases.push(
  { viewer: viewerB, surface: " TRACK ", context: " Mixed context ", limit: 12, exclude: "ARRAY['starter-bench-track-2','starter-bench-track-3']" },
  { viewer: viewerA, surface: "", context: "", limit: 12, exclude: "NULL::text[]" },
  { viewer: viewerB, surface: "home", context: "all-excluded", limit: 12,
    exclude: `ARRAY(SELECT 'starter-bench-track-'||g FROM generate_series(1,${tracks})g)` },
);
function claim(viewer) {
  return `select set_config('request.jwt.claim.sub',${quote(viewer ?? "")},true);`;
}
function parity(phase) {
  return cases.map((c, i) => `${claim(c.viewer)}
set local role authenticated;
select jsonb_build_object('phase','${phase}','case',${i},'rows',
coalesce(jsonb_agg(to_jsonb(r)-'ordinality' order by ordinality),'[]'::jsonb))
from public.get_starter_tracks_for_surface(${c.limit ?? "NULL"},${quote(c.surface)},${quote(c.context)},${c.exclude}) with ordinality r;
reset role;`).join("\n");
}
function plans(phase, text) {
  return `${claim(viewerA)}
set local role authenticated;
select 'PLAN:${phase}:rpc-first';
explain(analyze,buffers,timing off,format json)
select * from public.get_starter_tracks_for_surface(6,'home','home','{}');
select 'PLAN:${phase}:rpc-warm';
explain(analyze,buffers,timing off,format json)
select * from public.get_starter_tracks_for_surface(6,'home','home','{}');
reset role;
select 'PLAN:${phase}:expanded';
explain(analyze,buffers,timing off,format json) ${expanded(text)}`;
}
const sql = `begin;
set local statement_timeout='20s';
set local lock_timeout='3s';
${seed}
${definition(before)}
${plans("baseline", before)}
${parity("baseline")}
${definition(after)}
${plans("candidate", after)}
${parity("candidate")}
rollback;`;
const result = spawnSync("docker", [...docker,"exec","-i",container,"psql","-X","-q","-v","ON_ERROR_STOP=1",
  "-U","postgres","-d","postgres","-At"], { input: sql, encoding: "utf8", maxBuffer: 16*1024*1024, timeout: 180000 });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr.slice(-1500));
const payloads = { baseline: new Map(), candidate: new Map() };
const measured = {};
let label;
const lines = result.stdout.split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("PLAN:")) label = line.slice(5);
  if (line === "[") {
    const json = [line];
    while (++i < lines.length) { json.push(lines[i]); if (lines[i] === "]") break; }
    measured[label] = JSON.parse(json.join("\n"))[0];
  } else if (line.startsWith("{")) {
    const row = JSON.parse(line);
    if (row.phase) payloads[row.phase].set(row.case, row.rows);
  }
}
if (Object.keys(measured).length !== 6) throw new Error("Expected all six query plans.");
for (let i = 0; i < cases.length; i++) {
  if (!payloads.baseline.has(i) || !payloads.candidate.has(i) ||
      JSON.stringify(payloads.baseline.get(i)) !== JSON.stringify(payloads.candidate.get(i))) {
    throw new Error(`Full ordered payload mismatch in case ${i}.`);
  }
}
function summarize(p) {
  const sorts = [];
  function walk(n) {
    if (n["Node Type"] === "Sort") sorts.push({
      rows: n["Actual Rows"], method: n["Sort Method"], spaceKb: n["Sort Space Used"], storage: n["Sort Space Type"],
    });
    for (const child of n.Plans ?? []) walk(child);
  }
  walk(p.Plan);
  return { executionMs: p["Execution Time"], planningMs: p["Planning Time"],
    sharedReads: p.Plan["Shared Read Blocks"], sharedHits: p.Plan["Shared Hit Blocks"],
    tempWrittenBlocks: p.Plan["Temp Written Blocks"], sorts };
}
const summary = { tracks, tagsPerTrack: 6, collectionsPerTrack: collections,
  viewers: "taste with duplicate-source preference / no taste / no UID; authenticated SQL role",
  parityCases: cases.length, plans: Object.fromEntries(Object.entries(measured).map(([k,p]) => [k,summarize(p)])) };
const out = resolve(root, ".codex-private/starter");
mkdirSync(out, { recursive: true, mode: 0o700 });
writeFileSync(resolve(out, `comparison-${tracks}-${collections}.json`), JSON.stringify({ summary, cases, measured }, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ tracks, collections, parityCases: cases.length,
  measurements: Object.fromEntries(Object.entries(summary.plans).map(([k,v]) => [k,{executionMs:v.executionMs,planningMs:v.planningMs,tempWrittenBlocks:v.tempWrittenBlocks,largestSortKb:Math.max(0,...v.sorts.map(s=>s.spaceKb??0))}])) }, null, 2));
