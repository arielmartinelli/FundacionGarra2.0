import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adopciones: resolve(__dirname, 'adopciones.html'),
        admin: resolve(__dirname, 'admin.html'),
        login: resolve(__dirname, 'login.html')
      }
    }
  }
});
