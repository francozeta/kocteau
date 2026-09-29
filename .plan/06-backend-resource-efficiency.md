# Ruta backend: velocidad, recursos y recomendaciones

Estado: lista para iniciar por fases, una rama y una revisión por fase.

## Objetivo

Hacer que Kocteau se sienta rápido con poco tráfico y se mantenga predecible cuando crezca, sin pagar por trabajo especulativo ni introducir infraestructura que todavía no necesita.

## Baseline observado — 22 de julio de 2026

- Vercel había consumido `7 h 41 min / 4 h` de Fluid Active CPU.
- `/track/deezer/[providerId]` concentraba `4.2K` ejecuciones y `13 min` de CPU en 12 horas.
- Ya se aplicó contención: sin prefetch del resolver, sin fan-out de 18 resolvers, analytics en lotes y WAF a `60 req/min/IP`.
- Una carga del feed que emitía aproximadamente 15 POST de analytics ahora emite uno.
- `/` en producción: primer acceso observado ~`3.00 s` TTFB; accesos calientes entre `0.65–0.93 s`.
- En desarrollo autenticado, el Proxy consumía ~`0.18–0.40 s`; ahora usa `getClaims()`.
- La inspección remota de Postgres queda pendiente porque la CLI no dispone de una `SUPABASE_DB_PASSWORD` válida.

## Presupuestos de rendimiento

| Superficie | Meta inicial |
| --- | --- |
| Landing `/` caliente | P75 TTFB < 400 ms |
| Feed autenticado | respuesta backend P75 < 800 ms |
| Track canónico | contenido principal P75 < 1.2 s |
| Analytics de una vista | 1 POST por lote, máximo 20 eventos |
| Resolver Deezer | solo por navegación explícita; nunca por prefetch |
| Consultas nuevas | sin N+1; cursor antes que OFFSET |

Estas metas se ajustan con datos de producción, no con tiempos de compilación de `next dev`.

## Herramientas elegidas

- **Vercel Observability, Functions y Firewall** para CPU, invocaciones, TTFB y abuso.
- **Supabase `pg_stat_statements`, Advisors y `EXPLAIN (ANALYZE, BUFFERS)`** para encontrar consultas reales, no índices imaginados.
- **Supavisor** ya incluido por Supabase; no añadir otro pooler.
- **Sentry** solo para errores y trazas muestreadas. Revisar el costo de `/monitoring` antes de conservar el tunnel.
- **Next Data Cache + React `cache()`** para datos públicos y deduplicación por request.
- **TanStack Query** con `staleTime` explícito para evitar refetch inmediato tras hidratar.
- **k6** únicamente antes de una campaña o lanzamiento con tráfico; no instalarlo todavía.

No añadir Redis, Upstash, una cola externa ni un vector DB hasta que una medición demuestre que la caché de Next/Postgres no alcanza.

## Fase 0 — Observabilidad y presupuestos

Rama propuesta: `perf/observability-baseline`

1. Recuperar acceso read-only a los inspectores de Supabase.
2. Capturar `outliers`, `calls`, conexiones, cache hit e índices.
3. Añadir `Server-Timing` o trazas estructuradas a home, feed, track y RPC críticos con muestreo; evitar logs por cada request sano.
4. Crear alertas de Vercel para CPU, invocaciones y TTFB.
5. Guardar una tabla antes/después por ruta.
6. Separar tráfico humano y automatizado del resolver y medir cuántas visitas terminan en una reseña real.

Criterio de salida: sabemos qué tres consultas y qué tres rutas consumen más tiempo total y llamadas.

### Decisión temprana sobre el resolver Deezer

La recomendación por defecto es retirar `/track/deezer/[providerId]` si no demuestra
conversión humana. La búsqueda abriría el compositor con el track seleccionado y,
cuando exista una reseña, navegaría a la ruta canónica `/tracks/...`. De esta forma
los IDs arbitrarios dejan de ser una superficie pública costosa. Solo se conserva
el resolver si la telemetría prueba valor; en ese caso se vuelve público/cacheable,
sin Auth ni recomendaciones en el camino crítico.

## Fase 1 — Separar landing pública y aplicación

Rama propuesta: `perf/static-home-route`

1. Mantener `/` como landing pública cacheable y sin `getCurrentUser()`.
2. Mover el feed autenticado a `/feed`.
3. Después del login/onboarding, navegar a `/feed`.
4. Para una sesión existente que visita `/`, hacer un redirect ligero desde Proxy a `/feed`; visitantes sin cookie no consultan Auth.
5. Crear un bundle público cacheado para las tres reseñas y starter picks del mockup, con revalidación explícita.
6. Mantener metadata y JSON-LD en `/`.

Criterio de salida: un cache hit de `/` no ejecuta Auth ni consultas de usuario y alcanza P75 TTFB < 400 ms.

## Fase 2 — Presupuesto de requests del feed

Rama propuesta: `perf/feed-request-budget`

1. Evitar que TanStack vuelva a pedir `/api/feed` inmediatamente después de hidratar datos válidos.
2. Medir y diferir notifications, starter rail y perfiles hasta que sean visibles o necesarios.
3. Compartir consultas repetidas dentro del request con `cache()`.
4. Agrupar lecturas pequeñas solo cuando compartan ciclo de vida y permisos; no crear un endpoint gigante.
5. Mantener paginación por cursor.

Criterio de salida: la primera vista del feed usa una consulta primaria y no repite el mismo bundle tras hidratar.

## Fase 3 — Postgres y RPC

Rama propuesta: `perf/postgres-query-plans`

1. Revisar con `pg_stat_statements`:
   - `get_recommended_review_ids`
   - `get_starter_tracks_for_surface`
   - feed, follows, review state y analytics.
2. Ejecutar `EXPLAIN (ANALYZE, BUFFERS)` con entradas representativas.
3. Añadir únicamente índices respaldados por un plan: columnas de filtros, joins, orden y RLS.
4. Detectar N+1 y sustituirlos por joins/RPC o consultas `.in(...)`.
5. Revisar políticas RLS para usar `(select auth.uid())` e índices en columnas de propiedad.
6. Ejecutar Advisors y verificación de seguridad antes de cualquier migración.

Criterio de salida: cada migración incluye plan antes/después y no empeora escrituras ni RLS.

## Fase 4 — Recomendaciones rápidas y humanas

Rama propuesta: `perf/recommendation-pipeline`

No implementar ML pesado todavía. Kocteau ya tiene las señales correctas: tags explícitos e inferidos, follows, afinidad, entidades conocidas, calidad, recencia, diversidad y starter picks editoriales.

1. Separar **candidate generation** de **ranking**.
2. Cachear pools públicos/editoriales y respuestas Deezer durante más tiempo; el catálogo cambia poco.
3. Calcular personalización sobre un conjunto pequeño de candidatos locales, no sobre todo el catálogo.
4. Servir primero feed/track; recomendaciones secundarias entran por `Suspense` o carga diferida.
5. Solo cuando el volumen lo justifique, guardar snapshots por usuario/cohorte con TTL de 5–15 minutos y recalcular por señales relevantes.
6. Considerar `pgvector` únicamente cuando existan suficientes reseñas escritas para demostrar que embeddings mejoran descubrimiento frente a tags.

Criterio de salida: ranking explicable, sin llamadas externas en el camino crítico y con fallback editorial honesto.

## Fase 5 — Runtime, payload e imágenes

Rama propuesta: `perf/runtime-payload`

Estado: completa. Resultados y decisiones en `12-phase-5-runtime-payload.md`.

1. Auditar tamaño de Functions y dependencias incluidas en trazas del servidor.
2. Cargar composer, shaders, audio y menús pesados solo cuando se activan.
3. Verificar `sizes`, prioridad y caché de portadas/avatares.
4. Revisar el tunnel de Sentry `/monitoring`; mantenerlo solo si el valor supera su costo.
5. Aplicar `content-visibility` a listas largas si la medición de render lo pide.

Criterio de salida: menos JavaScript inicial y funciones más pequeñas sin degradar la lectura editorial.

## Fase 6 — Ensayo de crecimiento

Rama propuesta: `perf/load-readiness`

1. Crear escenarios k6 separados: landing, feed autenticado, track canónico y búsqueda.
2. Probar tráfico gradual, no un pico destructivo.
3. Confirmar límites WAF, pool de conexiones, error rate, P75/P95 y costo por 1,000 visitas.
4. Documentar rollback y umbrales de alerta.

Criterio de salida: Kocteau soporta el tráfico objetivo sin exceder presupuesto ni degradar la UX.

## Orden y regla de avance

Orden recomendado: `0 → 1 → 2 → 3 → 4 → 5 → 6`.

Cada fase debe incluir:

- una rama convencional independiente;
- medición antes/después;
- preview de Vercel cuando afecte UI o rutas;
- feedback del usuario antes de continuar;
- PR pequeño y reversible.

La siguiente acción recomendada es la **Fase 0**. La primera decisión visual/producto aparecerá en la Fase 1 al introducir `/feed`; no se hará sin revisar juntos la navegación y los redirects.
