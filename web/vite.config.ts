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
			registerType: "autoUpdate",
			manifest: false,
			workbox: {
				// Take over from any prior SW immediately and start serving the new
				// build to all open tabs. Without these two flags the new SW sits in
				// `waiting` state until every tab closes — that's the classic
				// "stuck on downloading update" symptom on Android PWAs.
				skipWaiting: true,
				clientsClaim: true,
				cleanupOutdatedCaches: true,
				// SPA fallback: any navigation request that misses the precache
				// falls back to index.html so deep links and reloads still work.
				navigateFallback: 'index.html',
				// Cap precache entry size; oversized assets will be runtime-cached
				// instead and won't block the SW install if they hiccup.
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
			}
		})
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@shared': fileURLToPath(new URL('../shared', import.meta.url))
		}
	},
	build: { sourcemap: false, cssMinify: 'esbuild' },
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