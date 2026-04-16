# Ivess Reggieri Altas

Landing estatica para altas de servicio de agua, inspirada en el flujo de referencia de IVESS y adaptada para Ivess Reggieri.

## Que incluye

- Hero comercial y propuesta de valor
- Formulario multipaso con validaciones
- Seleccion visual de producto con precio de ejemplo
- Asset local del bidon para deploy sin dependencias externas
- Servidor local simple con Node para pruebas
- Workflow listo para publicar en GitHub Pages
- Configuracion base para deploy rapido en Vercel

## Desarrollo local

Instala Node si no lo tienes y ejecuta:

```bash
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

## Archivos principales

- `index.html`: estructura principal del sitio
- `styles.css`: estilos de la landing y del formulario
- `src/main.js`: logica del formulario multipaso
- `server.js`: servidor local simple para pruebas

## Publicacion con GitHub Pages

El proyecto ya incluye un workflow en `.github/workflows/deploy-pages.yml`.

Cuando el repo este en GitHub:

1. Sube el proyecto a un repositorio.
2. En GitHub, entra a `Settings > Pages`.
3. En `Build and deployment`, selecciona `GitHub Actions`.
4. Cada push a `main` disparara la publicacion automaticamente.

## Publicacion con Vercel

El proyecto tambien incluye `vercel.json`, asi que puedes:

1. Importar el repo desde Vercel.
2. Dejar el framework como `Other`.
3. Mantener el root del proyecto tal como esta.
4. Publicar sin necesidad de build adicional.

## Subida al hosting final

Cuando el sitio este aprobado, para un hosting estatico normalmente alcanzan:

- `index.html`
- `styles.css`
- `src/main.js`
- `assets/`
- cualquier carpeta de imagenes o assets que agreguemos despues

`package.json` y `server.js` son utiles para trabajar y probar localmente, pero no suelen ser necesarios en un hosting estatico.
