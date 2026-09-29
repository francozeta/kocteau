# Shared Plans

This directory is versioned so a normal clone carries context between contributors
and devices. Read [AGENTS.md](../AGENTS.md), [CURRENT.md](../CURRENT.md), and the
relevant issue/PR first. Plans describe intent, not proof of delivery.

## Active

- [Discovery](./DISCOVERY.md): catalog-to-curation sequence, linked to
  [issue #206](https://github.com/francozeta/kocteau/issues/206).
- [Handoff](./HANDOFF.md): integrating parallel synthesis work with Studio autofill.

Keep shared phases, decisions, and handoffs here. Private experiments, raw logs,
screenshots, browser state, machine-specific scripts, and environment values belong
in ignored `local/` or `../.codex-private/`, never in a commit.

## Historical Home And Performance Plans

The numbered `01-` through `15-` files and the remaining section below are earlier
snapshots. Their statuses and branch names are historical, not today's approval
or task scope. Reconcile them with Git before resuming. The recommendation SQL
scripts now require a local fixture identity rather than a production user ID.

## Objetivo

Recomponer la ruta `/` para que, cuando el visitante no está autenticado, demuestre que Kocteau es un producto funcional, explique su propuesta sin parecer una landing genérica e invite a crear una cuenta. La experiencia autenticada seguirá priorizando `For You`.

## Límites acordados

- No rediseñar header ni sidebar.
- No rehacer la aplicación desde cero.
- No inventar usuarios, reseñas, ratings ni engagement.
- Usar contenido real para demostrar el producto.
- No ejecutar varias fases juntas.
- Cada fase termina con feedback explícito del usuario.
- Branches y commits usan convenciones normales: `feat/...`, `fix/...`, `refactor/...`, etc.

## Fases

| Fase | Estado | Resultado |
| --- | --- | --- |
| 1. Composición de la home | Activa | Estructura visual de baja fidelidad, navegable y con datos reales |
| 2. Rail y conversión invitado | Bloqueada por feedback | Rail autenticado centrado en usuarios; rail invitado con prueba de producto y CTA |
| 3. Cards gráficas y acabado | Bloqueada por feedback | Sistema de cards con slots de imagen reemplazables y dirección visual final |
| 4. Rendimiento | Bloqueada por feedback | Menos hidratación, consultas, JS y trabajo durante scroll |
| 5. SEO, accesibilidad y QA | Bloqueada por feedback | Metadata, contenido indexable, estados y verificación final |

## Ruta posterior al lanzamiento

El plan de backend, recursos y recomendaciones vive en
`06-backend-resource-efficiency.md`. Empieza con observabilidad y separa la
landing pública del feed autenticado antes de optimizar Postgres o introducir
infraestructura adicional.

## Regla de avance

Solo se modifica el código de la fase marcada como activa. Después de mostrar el resultado en desktop y mobile, se registran decisiones y correcciones en el archivo de esa fase. La siguiente fase no comienza hasta recibir aprobación.

## Decisiones todavía abiertas

- Copy definitivo del hero y del CTA.
- Cuánto contenido explicativo necesita la home antes de mostrar reseñas.
- Si el CTA del rail invitado debe llevar a `/login` o `/signup`.
- Qué tipo de gráfico personalizado acompañará cada card.
- Uso de `typeset` y `scroll-fade`: se evaluará en la Fase 3, no se instalará por anticipado.
