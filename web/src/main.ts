import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";
import { registerSW } from "virtual:pwa-register";
import { Quasar, Notify } from 'quasar';
import { OpenAPI } from '@/api-client';

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css';

// Import Quasar css
import 'quasar/dist/quasar.css';

// Configure OpenAPI client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
OpenAPI.BASE = API_BASE_URL
OpenAPI.TOKEN = async () => localStorage.getItem('auth_token') || ''

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(Quasar, {
	plugins: {
		Notify
	}, // import Quasar plugins and add here
});

app.mount("#app");

registerSW({
	immediate: true,
	onNeedRefresh() {
		// optionally show "New content available, please refresh."
		console.log("New content available, please refresh.");
	},
	onOfflineReady() {
		// optionally show "Ready to work offline"
		console.log("App ready to work offline.");
	},
	onRegistered(registration) {
		// registration is a ServiceWorkerRegistration instance
		console.log("Service worker has been registered.", registration);
	},
	onRegisterError(error) {
		console.error("SW registration error", error);
	}
})