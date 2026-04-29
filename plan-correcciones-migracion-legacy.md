# Plan De Correcciones De Migracion Legacy

## Objetivo

Dejar este proyecto funcional y visualmente alineado con `C:\tienda-abril`, manteniendo la arquitectura actual (`Laravel + Inertia + React + TypeScript + stack moderno`) y corrigiendo pantalla por pantalla las diferencias que quedaron abiertas en la migracion.

Este documento **no ejecuta cambios**. Solo define el relevamiento comparativo y el plan de trabajo por fases.

## Alcance Analizado

Se compararon:

- Rutas del proyecto actual vs rutas del legacy.
- Controladores y contratos de datos de ambos proyectos.
- Pantallas React/Inertia del proyecto actual.
- Flujos legacy en PHP para reparaciones y administracion.
- Tests E2E y tests de feature existentes como referencia de cobertura y de comportamiento esperado.

## Resumen Ejecutivo

El proyecto actual ya tiene **la mayor parte de la superficie funcional migrada**: tienda publica, detalle de producto, carrito, servicios, casi todo el backoffice y el tracking publico de reparaciones.

La mayor brecha real contra el legacy esta en el modulo de **reparaciones**, especialmente:

- `/ingreso`
- `/consulta`
- `/entregados`

Tambien quedaron diferencias puntuales pero importantes en administracion:

- `/login`: falta paridad del rate limiting y feedback de intentos restantes.
- `/admin/productos`: falta el flujo de alta rapida y la UI para guardar rotacion de imagenes.
- `/admin/ventas/nueva`: el scanner por camara figura en contrato/datos, pero no esta implementado en la pantalla actual.

En tienda publica y gran parte del admin, la deuda restante es sobre todo de **paridad visual, densidad, espaciado, microinteracciones y detalles de UX**, mas que de funcionalidades centrales.

## Estado General De Migracion

### Migrado En Gran Medida

- `/productos`
- `/producto/{slug}`
- `/carrito`
- `/servicios`
- `/admin`
- `/admin/anuncios`
- `/admin/contacto`
- `/admin/configuracion`
- `/admin/servicios`
- `/admin/categorias`
- `/admin/listados`
- `/admin/listados/imprimir`
- `/admin/ventas`
- `/admin/media`
- `/admin/backups`
- `/admin/papelera`
- `/reparacion`

### Migrado Parcialmente

- `/login`
- `/admin/productos`
- `/admin/productos/nuevo`
- `/admin/productos/{product}/editar`
- `/admin/ventas/nueva`
- `/consulta`
- `/entregados`

### Falta Paridad Funcional Importante

- `/ingreso`
- Ticket de ingreso de reparacion con QR / impresion / envio por WhatsApp
- Flujo tecnico de reparaciones de alta densidad equivalente al legacy

## Inventario Pantalla Por Pantalla

## 1. `/login`

### Ya Migrado

- Pantalla de login administrativo.
- Validacion base del formulario.
- Integracion con autenticacion actual.

### Diferencias Detectadas

- En legacy existia rate limiting explicito en login con feedback de intentos restantes.
- El comportamiento de bloqueo temporal y el mensaje de error no estan replicados con la misma UX.

### Estado

Migrado parcialmente.

## 2. `/productos`

### Ya Migrado

- Catalogo publico.
- Filtros por categoria.
- Busqueda.
- Ordenamientos.
- Secciones de destacados/novedades/ofertas.
- CTA hacia carrito y detalle.

### Diferencias Detectadas

- Falta validacion fina de paridad visual contra legacy.
- Hay que revisar espaciados, jerarquias, densidad de cards, textos, badges, variantes responsive y comportamiento exacto de filtros.

### Estado

Migrado funcionalmente; pendiente paridad visual fina.

## 3. `/producto/{slug}`

### Ya Migrado

- Ficha de producto.
- Galeria.
- Seleccion de imagen principal.
- Productos relacionados.
- Agregado al carrito.

### Diferencias Detectadas

- Falta comparacion visual exacta de layout, jerarquia de bloques, CTA, galeria y textos auxiliares.
- Revisar detalles de responsive y fallback de imagenes.

### Estado

Migrado funcionalmente; pendiente paridad visual fina.

## 4. `/carrito`

### Ya Migrado

- Alta desde catalogo/detalle.
- Cambio de cantidades.
- Eliminacion.
- Vaciado.
- CTA de pedido por WhatsApp.

### Diferencias Detectadas

- Falta validar paridad exacta de resumen, textos, iconografia, orden visual y estados vacios.
- Revisar microcopys y espaciados del flujo mobile.

### Estado

Migrado funcionalmente; pendiente paridad visual fina.

## 5. `/servicios`

### Ya Migrado

- Pantalla publica de servicios.
- Hero.
- Cards.
- CTA final.

### Diferencias Detectadas

- Falta validar orden de bloques, tono visual, copy exacto y responsive contra legacy.

### Estado

Migrado funcionalmente; pendiente paridad visual fina.

## 6. `/admin`

### Ya Migrado

- Dashboard administrativo.
- Accesos a modulos.
- Estructura general de backoffice.

### Diferencias Detectadas

- Pendiente control fino de densidad visual, jerarquia, indicadores y comportamiento responsive.

### Estado

Mayormente migrado.

## 7. `/admin/anuncios`

### Ya Migrado

- Gestion de anuncios.
- Alta, edicion, visibilidad y orden.

### Diferencias Detectadas

- Revisar paridad exacta del listado, affordances, confirmaciones y espaciado visual.

### Estado

Mayormente migrado.

## 8. `/admin/contacto`

### Ya Migrado

- Configuracion de informacion de contacto.

### Diferencias Detectadas

- Revisar layout, mensajes de guardado y agrupacion visual de campos.

### Estado

Mayormente migrado.

## 9. `/admin/configuracion`

### Ya Migrado

- Ajustes generales del sitio.
- Contratos principales de configuracion.

### Diferencias Detectadas

- Revisar paridad visual y orden exacto de bloques/campos.

### Estado

Mayormente migrado.

## 10. `/admin/servicios`

### Ya Migrado

- Alta/edicion/listado de servicios administrables.

### Diferencias Detectadas

- Revisar detalle visual del listado y consistencia con el legacy.

### Estado

Mayormente migrado.

## 11. `/admin/categorias`

### Ya Migrado

- CRUD de categorias.
- Reordenamiento.
- Merge.
- Visibilidad.

### Diferencias Detectadas

- Revisar paridad fina del layout y de los estados de accion.

### Estado

Funcionalmente migrado.

## 12. `/admin/productos`

### Ya Migrado

- Listado principal de productos.
- Filtros.
- Edicion inline.
- Acciones masivas.
- Duplicado.
- Eliminacion.

### Diferencias Detectadas

- En legacy existia un flujo de **alta rapida** con endpoint dedicado; el backend actual lo conserva, pero la UI no lo expone.
- Existe contrato para guardar **rotacion de imagenes** de producto, pero no hay UI actual equivalente.
- Falta revision fina de densidad, affordances, estados intermedios y detalles visuales del grid/listado.

### Estado

Migrado parcialmente.

## 13. `/admin/productos/imagenes-faltantes`

### Ya Migrado

- Vista/listado de productos con imagenes faltantes.

### Diferencias Detectadas

- Revisar paridad visual, filtros y acciones auxiliares respecto del legacy.

### Estado

Mayormente migrado.

## 14. `/admin/productos/skus-faltantes`

### Ya Migrado

- Vista/listado de productos con SKU faltante.

### Diferencias Detectadas

- Revisar paridad visual y microinteracciones.

### Estado

Mayormente migrado.

## 15. `/admin/productos/nuevo` y `/admin/productos/{product}/editar`

### Ya Migrado

- Formulario principal de producto.
- Integracion con media picker.
- Multiples slots de imagen.
- Guardado y actualizacion.

### Diferencias Detectadas

- Falta el flujo de alta rapida complementario al formulario principal.
- Falta la UI de rotacion/ajuste persistente de imagen que existia en legacy.
- Revisar equivalencia exacta de agrupacion de campos, ayudas visuales y manejo de imagenes.

### Estado

Migrado parcialmente.

## 16. `/admin/listados`

### Ya Migrado

- Generacion y vista previa de listados.

### Diferencias Detectadas

- Revisar paridad de layout, opciones y comportamiento de impresion.

### Estado

Mayormente migrado.

## 17. `/admin/listados/imprimir`

### Ya Migrado

- Vista de impresion.

### Diferencias Detectadas

- Validar equivalencia exacta de margenes, densidad y comportamiento de impresion real.

### Estado

Mayormente migrado.

## 18. `/admin/ventas`

### Ya Migrado

- Listado de ventas.
- Acceso a crear, ver ticket y eliminar.

### Diferencias Detectadas

- Revisar paridad visual del listado y de los estados vacios.

### Estado

Mayormente migrado.

## 19. `/admin/ventas/nueva`

### Ya Migrado

- Creacion de venta.
- Flujo principal de carga manual.

### Diferencias Detectadas

- En legacy habia soporte de **scanner por camara**.
- El contrato actual todavia informa `cameraScanner: true`, pero la pantalla React muestra que esta desactivado y no implementa el flujo.
- Esto es una diferencia funcional real, no solo visual.

### Estado

Migrado parcialmente.

## 20. `/admin/ventas/ticket/{sale}`

### Ya Migrado

- Ticket de venta.

### Diferencias Detectadas

- Revisar equivalencia visual de ticket impreso, tipografia, espaciado y datos auxiliares.

### Estado

Mayormente migrado.

## 21. `/admin/media`

### Ya Migrado

- Upload.
- Filtros.
- Copia de URL.
- Eliminacion.

### Diferencias Detectadas

- Revisar paridad visual y detalle de acciones respecto del legacy.

### Estado

Funcionalmente migrado.

## 22. `/admin/backups`

### Ya Migrado

- Crear backup.
- Restaurar.
- Descargar.
- Eliminar.

### Diferencias Detectadas

- Revisar exactitud del layout, feedback de acciones y densidad de tabla/listado.

### Estado

Funcionalmente migrado.

## 23. `/admin/papelera`

### Ya Migrado

- Vista de elementos eliminados.
- Restauracion.
- Eliminacion definitiva.

### Diferencias Detectadas

- Revisar paridad visual del listado y confirmaciones.

### Estado

Funcionalmente migrado.

## 24. `/consulta`

### Ya Migrado

- Login tecnico dedicado.
- Vista principal de reparaciones activas.
- Edicion base de reparacion.
- Agregado de reparaciones a una orden ya creada.
- Carga/eliminacion de imagenes originales y finales.
- Entrega, volver a pendiente y eliminacion.

### Diferencias Detectadas

- En legacy el workbench tenia un flujo mas denso y operativo:
  - guardado inline mas agresivo
  - affordances de cambios pendientes
  - cancelacion/reversion por bloque
  - accion directa de ticket
  - accion de WhatsApp por orden
  - variantes de entrega por via
  - modales/galerias mas ricas
  - captura por camara/galeria con UX mas guiada
  - edicion mas fina de identificadores/orden
- No existe hoy la paridad del ticket de reparacion asociado desde esta pantalla.
- Falta la opcion de envio / impresion / QR del ticket de reparacion.
- Falta revisar si la densidad visual actual soporta el mismo ritmo operativo que el legacy.

### Estado

Migrado parcialmente; pendiente paridad funcional y operativa.

## 25. `/ingreso`

### Ya Migrado

- Alta base de reparacion nueva.
- Formulario actual de ingreso simple.

### Diferencias Detectadas

- En legacy se podia crear **varios trabajos/reparaciones en una sola orden** desde el ingreso.
- En legacy habia **busqueda/autocompletado por DNI**.
- En legacy existian **tipos de servicio** que ayudaban a precargar descripciones y repuestos.
- En legacy el alta redirigia automaticamente al **ticket de ingreso** para imprimir/enviar.
- El proyecto actual solo cubre un flujo simplificado de alta unica y deja afuera parte importante del ingreso original.

### Estado

Falta paridad funcional importante.

## 26. `/entregados`

### Ya Migrado

- Vista de reparaciones entregadas.
- Busqueda basica.
- Filtro por estado.
- Acciones principales desde el panel.

### Diferencias Detectadas

- En legacy habia paginacion explicita.
- En legacy habia orden asc/desc.
- En legacy habia accion directa de WhatsApp al cliente.
- En legacy se podia editar `fecha_entregado`.
- En legacy existia reemplazo de imagen con flujo mas especifico.
- La pantalla actual es mas liviana y no llega a la paridad operativa.

### Estado

Migrado parcialmente.

## 27. `/reparacion`

### Ya Migrado

- Consulta publica por numero de orden y DNI.
- Resolucion de multiples reparaciones por orden.
- Estados visibles.
- Observaciones.
- Imagenes con lightbox.
- CTA a WhatsApp.
- Datos de contacto y reseteo de consulta.

### Diferencias Detectadas

- Falta ajuste fino de copy, jerarquia visual, espaciado, responsive y algunos detalles de presentacion.
- A nivel funcional, es una de las pantallas mas cercanas al legacy.

### Estado

Mayormente migrado.

## Hallazgos Transversales

### 1. La paridad de rutas esta practicamente cubierta

La estructura de rutas del proyecto nuevo replica casi completamente la del legacy. El problema principal ya no es de cobertura de pantallas, sino de **paridad funcional fina** y de **paridad visual/operativa**.

### 2. Reparaciones es el modulo mas sensible

La migracion actual captura el flujo base, pero todavia no iguala la ergonomia ni todas las capacidades del legacy para operador tecnico.

### 3. Hay endpoints y contratos ya migrados que la UI todavia no usa

Esto reduce el riesgo de implementacion porque varios gaps no requieren rediseñar backend completo, sino terminar de conectar la interfaz:

- busqueda por DNI en reparaciones
- alta rapida de producto
- rotacion de imagenes de producto
- bandera de scanner por camara en ventas

### 4. La deuda restante es una mezcla de funcionalidad y fidelidad visual

No conviene atacar solo CSS ni solo backend. La correccion debe hacerse por pantalla completa para evitar pantallas "a medias".

## Plan Detallado Por Fases

## Fase 0. Baseline De Paridad Y Matriz De Control

### Objetivo

Congelar una referencia clara antes de corregir para que cada pantalla tenga criterios verificables.

### Tareas

1. Armar matriz de control por pantalla con:
   - ruta
   - controlador
   - componente React
   - referencia legacy
   - estado: migrado / parcial / faltante
2. Capturar screenshots comparativos desktop y mobile de todas las pantallas actuales.
3. Capturar screenshots del legacy para las mismas pantallas y estados.
4. Definir checklist comun de comparacion:
   - estructura visual
   - acciones disponibles
   - estados vacios
   - mensajes
   - responsive
   - impresion
   - WhatsApp
   - flujos de imagen
5. Consolidar criterios de "paridad suficiente" para evitar rehacer una pantalla varias veces.

### Resultado Esperado

Una base objetiva para corregir pantalla por pantalla sin ambiguedad.

## Fase 1. Reparaciones Criticas: Recuperar El Flujo De Ingreso Legacy

### Pantallas

- `/ingreso`
- ticket de ingreso de reparacion asociado

### Objetivo

Cerrar la mayor brecha funcional del proyecto recuperando el flujo real de alta de reparaciones del legacy.

### Tareas

1. Extender `/ingreso` para soportar multiples trabajos dentro de una misma orden.
2. Conectar la busqueda/autocompletado por DNI usando el endpoint actual ya disponible.
3. Reponer selector de tipo de servicio y autocompletados de descripcion/repuestos equivalentes al legacy.
4. Replicar el comportamiento de armado de datos compartidos de cliente/equipo para multiples trabajos.
5. Implementar redireccion automatica al ticket de ingreso al finalizar el alta.
6. Crear o recuperar la pantalla/flujo de ticket de ingreso con:
   - visual tipo ticket
   - impresion
   - QR
   - envio por WhatsApp
7. Agregar validaciones y mensajes equivalentes al legacy para errores de alta.
8. Agregar cobertura E2E para alta simple y alta multi-trabajo.

### Criterio De Cierre

El operador debe poder reproducir de punta a punta el ingreso legacy sin volver al sistema viejo.

## Fase 2. Reparaciones Operativas: Workbench Y Entregados

### Pantallas

- `/consulta`
- `/entregados`

### Objetivo

Llevar el modulo tecnico a paridad operativa real con el legacy.

### Tareas Para `/consulta`

1. Reponer accion de ticket desde cada orden/reparacion.
2. Agregar accion de WhatsApp por orden.
3. Revisar y reintroducir affordances de guardado inline, cambios pendientes y cancelacion por bloque.
4. Evaluar reponer edicion de identificadores/renumeracion si el legacy la usa operativamente.
5. Reponer flujo de entrega con variantes de via cuando aplique.
6. Mejorar visor/carrusel/modal de imagenes para asemejarlo al legacy.
7. Reforzar UX de captura de imagen desde camara/galeria donde corresponda.
8. Ajustar densidad visual para trabajo intensivo de mostrador/servicio tecnico.

### Tareas Para `/entregados`

1. Reponer paginacion.
2. Reponer orden asc/desc.
3. Agregar accion de WhatsApp.
4. Permitir editar `fecha_entregado`.
5. Revisar flujo de reemplazo de imagenes para igualar el legacy.
6. Ajustar layout desktop/mobile para conservar legibilidad y densidad.

### Criterio De Cierre

El tecnico debe poder trabajar en activas y entregadas con la misma velocidad y cobertura funcional que en el legacy.

## Fase 3. Administracion Critica: Cerrar Gaps Funcionales Reales

### Pantallas

- `/login`
- `/admin/productos`
- `/admin/productos/nuevo`
- `/admin/productos/{product}/editar`
- `/admin/ventas/nueva`

### Objetivo

Resolver las diferencias administrativas que hoy impactan operacion real.

### Tareas Para `/login`

1. Reponer rate limiting equivalente al legacy.
2. Mostrar feedback de intentos restantes y bloqueo temporal con copy claro.
3. Alinear mensajes de error/espera con el comportamiento historico.

### Tareas Para `/admin/productos`

1. Reintroducir alta rapida de producto usando el endpoint ya existente.
2. Diseñar la UI de alta rapida en modo compatible con el admin moderno.
3. Reponer UI para persistir rotacion de imagenes.
4. Validar que el flujo rapido y el formulario completo convivan sin duplicacion de logica.

### Tareas Para `/admin/ventas/nueva`

1. Implementar el scanner por camara que el contrato actual sigue anunciando.
2. Integrarlo al flujo de carga de productos sin romper la carga manual.
3. Agregar fallback claro cuando no haya permisos de camara o el dispositivo no lo soporte.

### Criterio De Cierre

Quedan eliminadas las diferencias funcionales visibles entre el admin actual y el legacy en los puntos mas usados.

## Fase 4. Paridad Visual De Tienda Publica

### Pantallas

- `/productos`
- `/producto/{slug}`
- `/carrito`
- `/servicios`

### Objetivo

Llevar la tienda publica a equivalencia visual y de comportamiento con el legacy, manteniendo el stack moderno.

### Tareas

1. Ajustar header/footer/shell publico.
2. Igualar jerarquia tipografica, espaciados y densidad de cards.
3. Revisar badges, CTA, mensajes, estados vacios y responsive.
4. Comparar detalle de producto, galeria y relacionados estado por estado.
5. Verificar comportamiento exacto del carrito en desktop y mobile.
6. Normalizar estilos para que la apariencia final recuerde al legacy sin introducir deuda CSS desordenada.

### Criterio De Cierre

La tienda publica se percibe como la misma tienda migrada, no como una reinterpretacion parcial.

## Fase 5. Paridad Visual Y De UX Del Backoffice

### Pantallas

- `/admin`
- `/admin/anuncios`
- `/admin/contacto`
- `/admin/configuracion`
- `/admin/servicios`
- `/admin/categorias`
- `/admin/productos/imagenes-faltantes`
- `/admin/productos/skus-faltantes`
- `/admin/listados`
- `/admin/listados/imprimir`
- `/admin/ventas`
- `/admin/ventas/ticket/{sale}`
- `/admin/media`
- `/admin/backups`
- `/admin/papelera`

### Objetivo

Completar la fidelidad visual y de microinteraccion del admin ya migrado funcionalmente.

### Tareas

1. Revisar pantalla por pantalla:
   - estructura de cabecera
   - filtros
   - tablas/listados
   - botones
   - confirmaciones
   - mensajes vacios
   - responsive
2. Ajustar densidad visual para operacion de escritorio.
3. Corregir inconsistencias entre modulos administrativos que el legacy no tenia.
4. Verificar vistas de impresion y tickets con impresoras termicas o formato equivalente.

### Criterio De Cierre

El backoffice nuevo mantiene la ergonomia del legacy, pero con codigo y stack actualizados.

## Fase 6. Paridad Final, QA Y Cobertura

### Objetivo

Cerrar la migracion con una verificacion completa y evitar regresiones.

### Tareas

1. Extender tests E2E para cubrir:
   - ingreso multi-trabajo
   - ticket de reparacion
   - scanner por camara
   - alta rapida de producto
   - WhatsApp en reparaciones
   - filtros y paginacion de entregados
2. Agregar tests de feature para contratos backend recuperados.
3. Ejecutar regression pass manual desktop/mobile.
4. Hacer comparacion final por screenshots contra legacy.
5. Corregir diferencias residuales menores antes del cierre.

### Criterio De Cierre

La migracion queda verificable, mantenible y sin depender del legacy para tareas operativas.

## Orden Recomendado De Ejecucion

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6

Este orden prioriza primero lo que hoy tiene mayor impacto operativo real sobre el negocio.

## Prioridades Absolutas

Si hubiera que recortar alcance y atacar solo lo mas critico, el orden recomendado es:

1. `/ingreso`
2. ticket de reparacion
3. `/consulta`
4. `/entregados`
5. `/admin/ventas/nueva`
6. `/admin/productos`
7. `/login`

## Riesgos A Tener En Cuenta Durante La Implementacion

- Intentar igualar visualmente el legacy sin recuperar primero los flujos operativos puede dejar pantallas lindas pero incompletas.
- Rehacer estilos sin una matriz de comparacion puede introducir inconsistencias entre modulos.
- El modulo de reparaciones requiere validar cuidadosamente estados, imagenes, WhatsApp, impresion y tiempos de operador.
- La paridad del legacy debe respetarse en comportamiento, pero sin copiar deuda tecnica del sistema viejo.

## Definicion De Terminado

La migracion podra considerarse cerrada cuando:

- cada pantalla legacy tenga una contraparte actual validada
- no existan funcionalidades operativas del legacy sin reemplazo en el proyecto nuevo
- la UX principal sea reconocible para los usuarios del sistema anterior
- los flujos criticos tengan cobertura automatizada minima
- no haga falta volver al legacy para completar tareas del negocio

## Conclusion

El proyecto actual ya resolvio gran parte de la migracion estructural. Lo que queda no es rehacer todo, sino **cerrar con precision los flujos que todavia no alcanzan la paridad**, especialmente en reparaciones, y despues realizar una pasada sistematica de fidelidad visual y operativa en el resto de las pantallas.

El siguiente paso recomendado, cuando se decida ejecutar, es comenzar por **Fase 0** y luego avanzar directo sobre **Fase 1 y Fase 2**, porque ahi esta la mayor diferencia entre el proyecto nuevo y `C:\tienda-abril`.
