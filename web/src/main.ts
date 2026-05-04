import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import router from "./router";
import { registerSW } from "virtual:pwa-register";
import { Quasar, Notify, Dialog } from 'quasar';
import { OpenAPI } from '@shared/api-client';
import { i18n, setInterfaceLocale, type SupportedLocale } from '@/services/i18n';

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css';

// Import Quasar css
import 'quasar/dist/quasar.css';
import '@quasar/quasar-ui-qcalendar/QCalendarMonth.css';
import '@quasar/quasar-ui-qcalendar/QCalendarAgenda.css';

// Spajzka global styles (palette tokens, layout helpers, component refinements)
import './css/app.css';

// Configure OpenAPI client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
OpenAPI.BASE = API_BASE_URL
OpenAPI.TOKEN = async () => localStorage.getItem('auth_token') || ''

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(i18n);
app.use(router);
app.use(Quasar, {
	plugins: {
		Notify,
		Dialog
	}, // import Quasar plugins and add here
});

// Apply persisted interface locale (auth store hydrates from localStorage before this).
const { useAuthStore } = await import('@/stores/authStore');
const authStore = useAuthStore();
const initialLocale = (authStore.user?.interfaceLanguage as SupportedLocale | undefined) ?? 'cs';
setInterfaceLocale(initialLocale);

// Restore last visited route before mounting the app
const { useNavigationStore } = await import('@/stores/navigationStore');
const navigationStore = useNavigationStore();
const lastRoute = navigationStore.getLastRoute();

// Only restore if not already on the last route and not on root
if (lastRoute !== '/' && router.currentRoute.value.path !== lastRoute) {
	router.replace(lastRoute);
}

app.mount("#app");

// PWA update handling.
//
// `registerType: "autoUpdate"` (in vite.config.ts) downloads new SW versions
// in the background, but the new SW sits in the `waiting` state until every
// client closes — that's the "stuck on downloading update" symptom on Android
// where users keep the app open. We force the new SW to take over by calling
// the returned `updateSW(true)` whenever an update is detected, then reload.
//
// We also guard against a known PWA wedge: if a previous SW install failed
// (e.g. precache 404 mid-deploy), the registration can stay in a broken
// state. `onRegisterError` triggers a one-shot unregister so the next page
// load gets a clean slate.
const updateSW = registerSW({
	immediate: true,
	onNeedRefresh() {
		console.log("New content available — applying update.");
		// Take over immediately and reload. updateSW(true) returns Promise<void>
		// at runtime but the bundled type narrows it; cast to keep async-safe.
		void Promise.resolve(updateSW(true) as unknown as Promise<void>)
			.catch((err: unknown) => console.error("Failed to apply SW update:", err));
	},
	onOfflineReady() {
		console.log("App ready to work offline.");
	},
	onRegistered(registration: ServiceWorkerRegistration | undefined) {
		console.log("Service worker registered.", registration);
		if (!registration) return;
		// Periodically check for updates so long-lived sessions don't drift.
		const HOUR = 60 * 60 * 1000;
		setInterval(() => {
			registration.update().catch((err: unknown) => console.warn("SW update check failed:", err));
		}, HOUR);
	},
	onRegisterError(error: unknown) {
		console.error("SW registration error — unregistering to recover:", error);
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then((regs) => {
				regs.forEach((reg) => reg.unregister());
			}).catch(() => { /* best-effort */ });
		}
	}
})