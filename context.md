# Contexto de Diseño

## Propaganda impresa

Cuando el usuario escriba "propaganda", tomar como referencia el diseño aprobado en:

- `public/assets/print/vidriera-qr-precios-a4-bn.pdf`
- `public/assets/print/vidriera-qr-precios-a4-bn.png`

Estilo esperado:

- Formato A4 vertical, listo para imprimir.
- Blanco y negro, alto contraste, apto para impresora laser.
- Composición limpia: logo arriba, mensaje principal grande, QR real y escaneable al centro, datos del local al pie.
- Diseño pensado para vidriera/fachada: debe llamar la atencion desde lejos y ser facil de leer.
- Usar QR generado de forma deterministica, no generado por IA, para asegurar escaneabilidad.
- Mantener bordes/marcos simples, tipografia pesada y buen espacio en blanco.
- Para datos del local usar como base: `SUDOKU - Av. Jose de San Martin 2658, Parque San Martin, Merlo` y `Horario: Lunes a sabados de 10:30 a 13:30 y 17:00 a 20:30`.

Si se pide modificar una propaganda, preservar esta linea visual salvo que el usuario pida otro estilo.
