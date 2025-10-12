import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
	plugins: [
		vue({
			template: { transformAssetUrls }
		}),
		quasar({
			sassVariables: 'src/quasar-variables.sass'
		}),
		VitePWA({
			registerType: "autoUpdate"
		})
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	build: { sourcemap: false },
	server: {
		host: '0.0.0.0',
		port: 5173,
		watch: {
			usePolling: true
		},
		hmr: {
			clientPort: 5173
		}
	}
});