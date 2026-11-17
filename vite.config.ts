import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const src = resolve(import.meta.dirname, 'src');
/** Versión de package.json: se muestra en el login (subirla ahí en cada entrega al cliente). */
const { version } = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8')) as { version: string };

export default defineConfig({
  root: src,
  publicDir: resolve(import.meta.dirname, 'public'),
  envDir: import.meta.dirname,
  plugins: [tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { open: '/html/login.html' },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      // Cada página nueva del sistema se agrega aquí.
      input: {
        login: resolve(src, 'html/login.html'),
        panel: resolve(src, 'html/panel.html'),
        ventas: resolve(src, 'html/ventas.html'),
        historial: resolve(src, 'html/historial.html'),
        recibo: resolve(src, 'html/recibo.html'),
        cartera: resolve(src, 'html/cartera.html'),
        gastos: resolve(src, 'html/gastos.html'),
        prestamos: resolve(src, 'html/prestamos.html'),
        servicios: resolve(src, 'html/servicios.html'),
        pagosVendedores: resolve(src, 'html/pagos-vendedores.html'),
        usuarios: resolve(src, 'html/usuarios.html'),
      },
    },
  },
});
