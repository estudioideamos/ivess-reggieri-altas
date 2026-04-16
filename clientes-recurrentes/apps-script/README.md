# Apps Script - Clientes Recurrentes (Lookup + Pedidos)

Este script habilita dos acciones:

1. `GET ?action=lookup&phone=...`  
Busca cliente por teléfono en la hoja `Clientes`.

2. `POST { action: "order", ... }`  
Guarda pedido en la hoja `Pedidos` y envía email de aviso.

## Estructura de Google Sheets

Usa la planilla con ID:

`1QLG1s6I-MI2pXIR234OIO-Dj-mYBZ9I0jht3Rgod49Y`

Hoja de clientes: `Clientes`  
Columnas sugeridas:

- `telefono` (o `celular` / `whatsapp`)
- `nombre`
- `apellido`
- `email`
- `direccion`
- `localidad`
- `provincia`

Hoja de pedidos: `Pedidos`  
Se crea automáticamente si no existe.

## Publicación

1. Abrir [script.google.com](https://script.google.com) y crear/editar proyecto.
2. Pegar `Code.gs`.
3. `Implementar` -> `Gestionar implementaciones` -> `Aplicación web`.
4. `Ejecutar como`: **Tú**.
5. `Quién tiene acceso`: **Cualquiera**.
6. Guardar y copiar URL `/exec`.

## Frontend

En `clientes-recurrentes/index.html`:

```html
window.APP_CONFIG.customerScriptUrl = "TU_EXEC_URL";
```
