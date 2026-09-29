 # Fase 1: composición de la home

Estado: implementada, pendiente de feedback visual.

## Incremento implementado

- La vista autenticada conserva el feed existente.
- La vista invitada incorpora hero editorial, CTA de registro y acceso directo a reseñas.
- Una reseña real aparece como prueba inmediata del producto.
- El grid usa Starter Picks reales y dos esquemas funcionales sin nuevas dependencias.
- La portada muestra tres reseñas recientes y evita scroll infinito.
- El CTA final cierra el recorrido antes de pasar a la siguiente fase.

Pendiente de decisión: copy, altura del hero, orden de bloques, cantidad de cards y peso del CTA. No se abrirá la Fase 2 hasta recibir este feedback.

## Pregunta que debe responder esta fase

¿Puede una persona entender en pocos segundos que Kocteau sirve para leer y escribir reseñas musicales, ver contenido real y encontrar un siguiente paso claro, sin que la pantalla deje de sentirse como una aplicación?

## Alcance

Solo se trabajará la composición del contenido principal de `/` para visitantes. El feed autenticado, header, sidebar, lógica de recomendaciones, auth y Supabase quedan fuera.

## Hipótesis inicial

La mejor composición no es una landing larga separada del producto. Debe ser una portada editorial híbrida:

1. Una introducción compacta con H1, una frase breve y dos acciones.
2. Una reseña real visible inmediatamente como prueba del producto.
3. Un bloque corto que explique las tres acciones centrales: descubrir, reseñar y formar gusto.
4. Más contenido real antes del CTA final.
5. Un cierre minimalista para crear perfil.

## Primer incremento de código

El primer cambio será deliberadamente de baja fidelidad:

- separar la vista invitada de la vista autenticada dentro de `/`;
- crear el esqueleto semántico de la portada invitada;
- reutilizar una o dos reseñas reales;
- usar superficies y tipografía existentes;
- usar placeholders neutros para los futuros visuales;
- mantener las acciones funcionando;
- no introducir todavía animaciones, shaders, nuevas dependencias ni arte final.

## Wireframe inicial

```text
[ Intro editorial                         ]
[ H1 + explicación breve                 ]
[ Crear perfil ]  [ Explorar reseñas ]

[ Reseña real destacada                  ]

[ Card ancha: escribir una reseña        ]
[ Card: descubrir ] [ Card: formar gusto ]

[ Reseñas/conversaciones recientes       ]

[ CTA final minimalista                  ]
```

En mobile todo se convierte en una única secuencia. Ningún rail de escritorio se comprime dentro de la columna móvil.

## Criterios para pedir feedback

- La primera pantalla demuestra producto, no solo promesa.
- La reseña tiene más peso que las cards explicativas.
- El hero no desplaza el contenido real demasiado abajo.
- La jerarquía sigue siendo clara al ocultar temporalmente imágenes y colores.
- El CTA de registro es visible sin bloquear la exploración.
- La composición funciona con contenido escaso.

## Lo que revisaremos juntos

1. Altura y densidad del hero.
2. Orden entre reseña destacada y explicación del producto.
3. Número de cards explicativas.
4. Peso visual del CTA principal.
5. Longitud total de la home.

## Condición de cierre

La estructura queda aprobada en desktop y mobile. Solo entonces se abre la Fase 2.
