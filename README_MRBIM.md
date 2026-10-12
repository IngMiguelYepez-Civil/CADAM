# MrBIM Component Studio — OpenRouter v0.1

Adaptación de CADAM, conservando su motor OpenSCAD, visor, herramientas de
compilación y exportación. Licencia y atribuciones del origen se conservan.

## Implementado

- Configuración de IA con OpenRouter OAuth PKCE S256 y validación de estado,
  caducidad y cuenta. La clave permanece en memoria, nunca en el repositorio
  ni en almacenamiento persistente del navegador.
- Selección del catálogo público vigente: modelos con herramientas y visión,
  mostrando precios de entrada/salida de catálogo por millón de tokens.
- Generación paramétrica y mejora de prompt pagadas por la cuenta del visitante.
  Títulos locales sin IA. No se realizan llamadas a claves de Miguel.
- Sin conexión propia, el chat responde 428 antes de invocar proveedores.
- Máximo 3 construcciones automáticas por instrucción, 4 pasos por llamada,
  8.192 tokens de salida, 120 segundos y sin reintentos del SDK.
- Facturación Adam deshabilitada; enlaces de saldo apuntan a OpenRouter.
- Generación externa de mallas deshabilitada hasta tener un conector propio
  por usuario. El modo disponible para crear componentes es paramétrico.
- Analítica y trazas heredadas deshabilitadas para no registrar credenciales.

## Ejecutar

1. Node.js y npm según `package.json`; `npm ci`.
2. Configurar Supabase con el esquema/migraciones y almacenamiento incluidos
   en `supabase/`. Auth y la base de datos siguen siendo requisitos de CADAM.
3. Configurar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y, para operaciones
   administrativas que lo requieran, `SUPABASE_SERVICE_ROLE_KEY` en el entorno
   del servidor. Usar `.env.local.template` como referencia. No poner claves
   privadas en variables `VITE_` ni configurar claves compartidas de IA.
4. `npm run dev`; la aplicación conserva la ruta `/cadam` y el puerto 3000.
5. Entrar en la aplicación, abrir Configuración y conectar OpenRouter.
6. Autorizar con la propia cuenta, elegir modelo, volver al generador y
   describir un componente con medidas. El consumo se carga a OpenRouter.
7. Compilar, revisar el componente y usar las exportaciones existentes.

La conexión se olvida al recargar la página. Desconectar borra la credencial
en memoria; revocar la clave y gestionar saldo/límites se hace en OpenRouter.
La conexión usa el callback de la misma aplicación: `/cadam/settings`.

## Validación

```bash
node --test shared/*.test.ts src/server/*.test.ts
npm run typecheck
npm run build
```

Resultados del 12-10-2026: 35 pruebas pasaron al ejecutar
`node --test shared/*.test.ts src/server/*.test.ts`, incluidas las de
límites y credenciales;
compilación TypeScript y build de cliente/servidor con prerender pasaron.
Se comprobó también el handler real ante credenciales ausentes y el intercambio
OAuth con respuestas simuladas: no reutiliza el código, limpia la URL y rechaza
cambio de cuenta durante la autorización. No se hicieron llamadas de inferencia
pagadas. No se ha verificado autorización real ni generación completa con saldo.

El preview de build usa `127.0.0.1` para evitar que Vite enumere interfaces de
red inaccesibles en este entorno. La advertencia heredada de Shiki/WASM no
impidió generar el build; la interfaz debe revisarse al configurar el entorno.

## Pendiente para publicar

- Configurar un proyecto Supabase operativo para MrBIM.
- Verificar OAuth real y generar/exportar un componente con la cuenta del usuario.
- Revisar visualmente el flujo en navegador y completar identidad MrBIM.
- Revisar y validar la adaptación `mrbim/bootstrap` en el fork propio:
  https://github.com/IngMiguelYepez-Civil/CADAM. La aplicación aún no está desplegada.
- Elegir alojamiento para la app con servidor; el portal puede enlazarla desde
  Interactive Lab. No subir solo el HTML al portal: incluye backend y Supabase.

IFC y RFA nativos siguen siendo extensiones futuras; esta versión no convierte
automáticamente una malla STL en una familia Revit paramétrica.

Referencia: https://openrouter.ai/docs/guides/overview/auth/oauth
