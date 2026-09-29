# Fase 4: rendimiento

Estado: bloqueada hasta aprobar la Fase 3.

## Baseline

Medir producción, no solo desarrollo: carga inicial, solicitudes, peso de JavaScript, imágenes, respuesta del servidor, hidratación y comportamiento durante scroll.

## Candidatos ya detectados

- Evitar duplicar el feed en el estado hidratado.
- Renderizar la portada invitada principalmente en servidor.
- Cargar composer, menús y acciones solo cuando se necesiten.
- Evitar consultas del rail posteriores a la hidratación cuando puedan resolverse en servidor.
- Sustituir el shader del CTA por los assets aprobados.
- Reducir el trabajo de analytics que recorre reseñas durante scroll.
- Revisar imágenes, prioridades, tamaños y caché con datos reales.

## Regla

Cada optimización debe tener una medición antes y después. No se eliminará funcionalidad solo para mejorar un número.

