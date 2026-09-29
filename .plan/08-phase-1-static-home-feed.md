# Fase 1 — landing pública y feed autenticado

Fecha: 2026-07-22
Rama: `perf/static-home-route`
Base: `perf/observability-baseline`

## Objetivo

Separar la adquisición pública de la experiencia personalizada para que `/` pueda servirse desde caché y para que Auth, perfil, onboarding y recomendaciones se ejecuten únicamente dentro de `/feed`.

## Decisión de rutas

- `/`: landing pública, ISR, sin lectura de cookies ni Auth.
- `/feed`: feed autenticado y dinámico.
- `/feed` representa `For You` y es la URL canónica del estado predeterminado.
- `/feed?view=following` y `/feed?view=top-rated` representan filtros del mismo recurso.
- No se crean `/feed/following` ni `/feed/top`: no son páginas de producto independientes y duplicarían segmentos, estados y mantenimiento.
- Los tabs no hacen prefetch automático. Un tab visible no debe disparar una consulta personalizada antes del clic.
- `/feed` es `noindex` y queda fuera del sitemap; el contenido público indexable continúa en `/`, `/reviews`, tracks y perfiles.

## Cambios

- Mover el feed autenticado desde `/` a `/feed`.
- Mantener `/` con un bundle público de tres reseñas y starter picks cacheados.
- Redirigir una sesión válida de `/` a `/feed` desde Proxy.
- Redirigir login y onboarding completados a `/feed`.
- Excluir imágenes, fuentes, documentos estáticos y el túnel de Sentry del Proxy.
- Reutilizar una sola lectura de `profiles` para perfil y estado de onboarding.
- Mantener la lógica OTP, RLS y RPCs de recomendación intacta.

## Verificación

- `pnpm --filter web lint`.
- `pnpm --filter web build`.
- La tabla de Next debe mostrar `/` como estática/ISR y `/feed` como dinámica.
- Verificar guest `/`, guest `/feed`, sesión `/`, `/feed`, Following y Trending.
- Comprobar que assets públicos no ejecuten Proxy.

## Fuera de alcance

- Reescribir el algoritmo For You.
- Cambiar RLS o migraciones.
- Convertir los tabs a estado exclusivamente cliente.
- Fusionar a `main` antes del feedback del preview.
