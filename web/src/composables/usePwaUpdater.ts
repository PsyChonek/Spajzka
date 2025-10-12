// src/composables/usePwaUpdater.ts
import { ref, onMounted } from "vue";
import { registerSW } from "virtual:pwa-register";

export function usePwaUpdater() {
	const needRefresh = ref(false);
	let updateSW: (reloadPage?: boolean) => void = () => {};

	onMounted(() => {
		updateSW = registerSW({
			immediate: true,
			onNeedRefresh() {
				needRefresh.value = true;
			}
		});
	});

	return { needRefresh, update: () => updateSW(true) };
}