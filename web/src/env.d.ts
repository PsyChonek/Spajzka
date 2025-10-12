/// <reference types="vite/client" />

declare module "virtual:pwa-register" {
	export type RegisterSWOptions = {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: any) => void;
	};

	export function registerSW(
		options?: RegisterSWOptions
	): (reloadPage?: boolean) => void;
}

declare module "virtual:pwa-register/vue" {
	import type { Ref } from "vue";
	export type UseRegisterSWOptions = {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: any) => void;
	};
	export function useRegisterSW(
		options?: UseRegisterSWOptions
	): {
		needRefresh: Ref<boolean>;
		offlineReady: Ref<boolean>;
		updateServiceWorker: (reloadPage?: boolean) => void;
	};
}

declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<{}, {}, any>;
	export default component;
}