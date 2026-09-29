# Fase 0 — baseline de observabilidad

Fecha: 2026-07-22
Rama: `perf/observability-baseline`

## Objetivo

Conservar señales suficientes para diagnosticar lentitud sin pagar el coste de trazar o registrar cada solicitud. Esta fase no cambia recomendaciones, consultas, índices ni RLS.

## Vercel

Baseline reportado en la ventana de 12 horas anterior:

- Fluid Active CPU: `7 h 41 min / 4 h`.
- Active CPU p75: `275 ms`.
- Memoria media: `427 MB / 2.05 GB`.
- CPU throttle p75: `8.6%`.
- Cold starts: `2.2%`.
- `/track/deezer/[providerId]`: aproximadamente `4.2K` ejecuciones y `13 min` de CPU.

Los runtime logs actuales siguen mostrando IDs distintos de Deezer, respuestas `200` y `cache: MISS`. El patrón es compatible con crawling distribuido, no con una navegación normal del producto.

La consulta de métricas por CLI no está disponible en el plan actual porque requiere Observability Plus. La medición continuará con Functions/Runtime Logs de Vercel y estadísticas de Supabase.

## Supabase / Postgres

Estadísticas acumuladas desde el último reset (`133 días`):

- Base: `20 MB`.
- Index hit rate: `1.00`.
- Table hit rate: `1.00`.
- `entities`: `22` filas estimadas y `649,547` sequential scans.
- Dos consultas repetidas de resolución de entidades acumulan `231,272` y `220,806` llamadas; consumen solo unos `34 s` y `33 s` totales en Postgres.
- La lectura completa de usuario de Auth acumula `74,041` llamadas; las sesiones, `75,097`.
- `set_config(...)` de PostgREST acumula `594,619` llamadas.

Conclusión: Postgres no está saturado y los lookups individuales son baratos. El coste dominante está en la cantidad de invocaciones completas —middleware, Auth, RSC y proveedor externo—, no en una consulta lenta que justifique Redis o índices nuevos.

## Advisors

Baseline: `84` advertencias.

- `27` políticas RLS con `auth_rls_initplan`.
- `29` casos de políticas permisivas duplicadas.
- `4` índices duplicados en `reviews`.
- `23` advertencias de ejecución de funciones `SECURITY DEFINER`.
- `1` advertencia de leaked password protection.

No se corrigen en esta fase: requieren revisar intención, permisos y migraciones una por una. Se moverán a la fase de Postgres/RLS.

## Cambio de observabilidad

- Sentry server/edge/client: muestreo de trazas de producción de `100%`/`10%` a `5%`.
- Sentry Logs desactivado en server/edge de producción.
- `sendDefaultPii` desactivado en todos los runtimes.
- Tareas del servidor: log estructurado, umbral lento de `750 ms`, muestra aleatoria de `1%` en producción y contexto sensible filtrado.
- Cobertura explícita añadida a `/`, `/api/feed` y el resolver Deezer.

## Decisión para la siguiente fase

Prioridad 1: separar el landing público de la carga autenticada para que `/` no abra Auth/feed/starter data a visitantes.

Prioridad 2: decidir el destino del resolver Deezer. Si no convierte a review/login, retirarlo como página pública; si convierte, resolver únicamente entidades canónicas y evitar Auth para visitantes.
