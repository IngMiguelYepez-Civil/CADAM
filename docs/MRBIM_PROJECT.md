# MrBIM Component Studio — base de trabajo

Nombre de trabajo; no sustituye la identidad aprobada de MrBIM.

## Estado

Repositorio de origen: https://github.com/Adam-CAD/CADAM
Commit de origen: f89ea925f5c3d87a7a8d3932e4cafeb55c64cc04
Rama local: mrbim/bootstrap
Fecha: 2026-10-12

La integración OpenRouter por usuario está implementada en esta rama local.
Incluye OAuth PKCE S256, catálogo con herramientas y visión, generación
paramétrica con credenciales del visitante y límites de consumo automático.
No está desplegada y no se ha creado un fork remoto. Ver README_MRBIM.md.

## Objetivo y restricciones

Herramienta web del Interactive Lab de MrBIM para generar componentes o
entidades desde texto, dimensiones e imágenes. Mantener chat, visor 3D,
controles paramétricos, historial y exportación de CADAM, con identidad MrBIM.
El usuario paga todas las llamadas de IA con su cuenta: generación, corrección,
imágenes, mallas, títulos y sugerencias. No usar claves de Miguel ni recurrir a
ellas como fallback. Costos de hosting y almacenamiento son independientes.

## Auditoría inicial

- `src/server/aiChat.ts`: adaptado a OpenRouter con credencial del visitante.
  Se retiraron la facturación central y las llamadas auxiliares Anthropic.
- `src/server/billingClient.ts`: integración con facturación de origen.
- `src/server/imageGen.ts`: generación de imágenes por proveedores externos.
- `src/server/mesh.ts`: revisar operaciones de malla y cargos externos.
- `src/server/modelCapabilities.ts` y `src/lib/utils.ts`: capacidades y catálogo.
- `src/vendor/openscad-wasm/`: motor CAD del navegador.
- `src/routes/api/parametric-chat.ts`: punto de entrada del chat paramétrico.

## Arquitectura propuesta

1. Portal MrBIM enlaza a la herramienta web; dominio/ruta definitiva pendiente.
2. Usuario conecta su cuenta OpenRouter con OAuth PKCE S256 y estado anti-CSRF.
3. Adaptador utiliza credenciales del usuario para todas las operaciones de IA.
4. IA genera código OpenSCAD; motor compila y visor muestra geometría.
5. Usuario ajusta parámetros, valida medidas y exporta formatos existentes.
6. Imágenes/mallas externas son una función opcional con credencial propia;
   no habilitarlas con credenciales compartidas del servidor.

La credencial permanece en memoria para el prototipo. Persistencia posterior
solo con un diseño específico de almacenamiento seguro y revocación.
Nunca guardar secretos en repositorio, URLs, archivos CAD o telemetría.
Sin credencial o saldo, se detiene la IA y sigue disponible la edición manual.

## Proveedores

OpenRouter ofrece conexión con una clave controlada por el usuario:
https://openrouter.ai/docs/guides/overview/auth/oauth

Evaluar modelos de origen chino por compatibilidad, precio vigente y resultados
CAD; incluir DeepSeek y modelos Qwen con visión si cumplen la prueba.
No fijar un modelo ni afirmar que es el más barato antes de medirlo.
Un generador de imágenes o mallas no entrega automáticamente geometría BIM
paramétrica. Mantener vías distintas para CAD dimensional y recursos visuales.

## Primer ciclo de implementación

- Auditar todas las llamadas cobrables, autenticación y facturación heredada.
- Implementar conexión de usuario y un adaptador paramétrico OpenRouter.
- Quitar la dependencia de facturación Adam para esa modalidad.
- Hacer títulos/sugerencias locales o cobrarlos a la cuenta del usuario.
- Probar un componente desde texto hasta exportación con unidades verificadas.
- Añadir imagen de referencia solo con modelos que soporten visión.
- Adaptar interfaz MrBIM usando recursos aprobados; no inventar otro logo.
- Integrar el enlace en Interactive Lab tras validar el prototipo.

## Criterios de aceptación

- Sin clave propia no se realiza ninguna llamada de IA cobrable.
- Ninguna ruta, error o fallback usa credenciales de Miguel.
- Generación y corrección funcionan; límites/reintentos están acotados.
- Edición de parámetros conserva medidas y produce exportación válida.
- Credenciales no aparecen en registros, historial ni archivos descargados.
- Costos, uso y fallos se comunican sin prometer gratuidad.
- Preservar LICENSE y atribuciones del repositorio de origen.

## Alcance BIM

Primer ciclo: componentes CAD paramétricos utilizables como base geométrica.
IFC, propiedades BIM, conectores MEP y familias Revit nativas son extensiones
posteriores con validación propia; STL/SCAD/DXF no equivalen a una familia RFA.

## Continuidad

Mantener este producto separado de MrBIM Field Inspector, enlazado desde el
mismo portal. La copia local conserva `origin` apuntando al repositorio original;
antes de publicar cambios se necesita un repositorio propio/fork y cambiar
el remoto de publicación. No hacer push al repositorio de origen.
