# Pruebas visuales

Referencia: el sitio actual (`site/`). Matriz: 138 capturas (72 páginas completas, 54 del hero en tres horarios, 12 extras).

Calibración del umbral (2 de noviembre de 2026, 40 capturas repetidas del mismo sitio): 36 salieron idénticas (0 píxeles),
el máximo fue 0,0127 % (`faq__1440__es__layout__day`, 707 píxeles). Umbral adoptado: 0,1 por píxel (YIQ) y 0,001 (0,1 %) de
píxeles distintos por captura; el texto visible se compara de forma exacta.

Modos: `layout` usa `prefers-reduced-motion: reduce` (todo el contenido visible, sin animaciones); `hero` usa movimiento normal
con `animations: "disabled"` en la captura. Fuentes locales idénticas en ambos lados; React local; red externa bloqueada; reloj fijo.

La línea base (`tests/visual/baseline/current`) no se versiona: se regenera con `npm run test:visual:baseline`.
