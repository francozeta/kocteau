# Fase 2 — presupuesto de requests y caché

Fecha: 2026-07-22
Rama: `perf/request-budget-cache`
Base: `main` después de integrar las fases 0 y 1

## Objetivo

Reducir viajes repetidos a Next, Supabase Auth, PostgREST y Deezer sin relajar RLS ni convertir el feed en datos globalmente cacheables.

## Baseline remoto

- Base: 20 MB.
- Index hit rate: 1.00.
- Table hit rate: 1.00.
- Validaciones completas de usuario observadas: ~74,000.
- Búsquedas individuales de entidad por provider/type/provider_id: >230,000.
- El problema actual es volumen de requests repetidos, no saturación de Postgres ni falta de memoria.

## Decisiones

- Los parámetros `?view=following` y `?view=top-rated` se conservan porque aportan URL compartible, historial y recuperación tras refresh.
- Cambiar de tab después de hidratar usa `history.pushState` y TanStack Query; no ejecuta otra navegación RSC.
- Cada vista mantiene una cache key independiente.
- For You y Following permanecen frescos 2 minutos; Latest y Trending 5 minutos; datos inactivos se conservan 30 minutos.
- No hay refetch automático al enfocar la ventana ni al recuperar conexión. Las mutaciones continúan actualizando o invalidando la caché.
- Las lecturas usan claims JWT verificados y cacheados por request. Las escrituras y Studio conservan `getUser()`.
- Las respuestas privadas del feed no se comparten en CDN.
- Los lookups estables de entidades usan 15 minutos de Data Cache con invalidación por tags.
- El resolver Deezer solo acepta IDs numéricos, bloquea crawlers conocidos antes del render y cachea recursos de catálogo 24 horas.
- No se añade Redis, un pool externo ni otra base: Supabase Data API ya gestiona conexiones y las métricas no justifican infraestructura adicional.

## Identidad del deployment

- Se reemplaza el `favicon.ico` heredado que contenía el triángulo de Vercel.
- Se añaden `icon.png` y `apple-icon.png` con el mark de Kocteau.
- Next expone explícitamente PNG, SVG, shortcut y apple icon.

## Verificación

- `pnpm --filter web lint`.
- `pnpm --filter web exec tsc --noEmit --allowImportingTsExtensions`.
- `pnpm exec tsx --test lib/deezer.test.ts lib/seo-routes.test.ts` desde `apps/web`.
- `pnpm --filter web build`.
- `git diff --check`.
- Preview: verificar back/forward entre tabs, ausencia de navegación RSC al cambiar tab, favicon y rechazo de resolver inválido/crawler.

## Fase siguiente

`perf/postgres-query-plans`: inspeccionar outliers, calls, índices y RLS; cualquier migración deberá incluir `EXPLAIN (ANALYZE, BUFFERS)` antes/después. No crear índices por intuición.
