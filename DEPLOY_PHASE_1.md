# Instrucciones de Despliegue - Fase 1

## Pasos para desplegar en Cloudflare Workers

### 1. Configurar Cloudflare API Token

```bash
export CLOUDFLARE_API_TOKEN=tu_api_token_aqui
```

O en Windows PowerShell:
```powershell
$env:CLOUDFLARE_API_TOKEN="tu_api_token_aqui"
```

Para crear el token, ir a: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

Permisos necesarios:
- Account > Workers Scripts > Edit
- Account > Workers KV Storage > Edit
- Account > Account Settings > Read

### 2. Crear namespace KV

```bash
npx wrangler kv namespace create products_cache
```

Esto devolverá un ID como: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Actualizar wrangler.toml

Reemplazar el `id` y `preview_id` con los IDs devueltos:

```toml
[[kv_namespaces]]
binding = "PRODUCTS_CACHE"
id = "ID_DEVUELTO_POR_EL_COMANDO_ANTERIOR"
preview_id = "ID_DEVUELTO_POR_EL_COMANDO_ANTERIOR"
```

### 4. Desplegar Worker

```bash
npx wrangler deploy
```

### 5. Desplegar sitio en Cloudflare Pages

```bash
npx wrangler pages deploy dist
```

O si ya está configurado como proyecto Pages:
```bash
npx wrangler pages project create circulomatero
npx wrangler pages deploy dist --project-name circulomatero
```

## Notas importantes

- El Worker se ejecutará cada 10 minutos (Cron Trigger) para actualizar el caché
- El endpoint `/api/products.json` servirá los productos con caché
- El sitio debe estar en Cloudflare Pages para que el Worker funcione correctamente
- El plan Free de Cloudflare es suficiente para este proyecto (100k requests/day)

## Verificación después del despliegue

1. Visitar `https://circulomatero.privateweb.workers.dev/api/products.json` y verificar que devuelva productos
2. Ejecutar Lighthouse móvil (Moto G Power, 4G lenta) antes y después
3. Verificar que los productos carguen rápidamente
4. Verificar que el botón "Cargar más" funcione
