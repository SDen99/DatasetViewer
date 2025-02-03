import { StorageService } from '../services/StorageServices';
import type { UIState } from '$lib/core/services/StorageServices';

export class UIStore {
	private static instance: UIStore;
	private initialized = false;

	uiState = $state<UIState>({
		leftSidebarOpen: true,
		rightSidebarOpen: true,
		viewMode: 'data',
		SDTM: false,
		ADaM: false
	});

	private constructor() {
		// Load initial state from storage
		const storage = StorageService.getInstance();
		const savedState = storage.loadState();
		if (savedState.uiPreferences) {
			this.uiState = savedState.uiPreferences;
		}

		// Only set up the effect after initial state is loaded
		$effect.root(() => {
			$effect(() => {
				if (this.initialized) {
					StorageService.getInstance().saveState({
						uiPreferences: this.uiState
					});
				}
			});
		});

		this.initialized = true;
	}

	static getInstance(): UIStore {
		if (!UIStore.instance) {
			UIStore.instance = new UIStore();
		}
		return UIStore.instance;
	}

	toggleSidebar(side: 'left' | 'right') {
		this.uiState = {
			...this.uiState,
			[`${side}SidebarOpen`]: !this.uiState[`${side}SidebarOpen`]
		};
	}

	setViewMode(mode: 'data' | 'metadata' | 'VLM') {
		this.uiState = {
			...this.uiState,
			viewMode: mode
		};
	}

	setDefineXMLType(isSDTM: boolean, isADaM: boolean) {
		this.uiState = {
			...this.uiState,
			SDTM: Boolean(isSDTM),
			ADaM: Boolean(isADaM)
		};
	}

	reset() {
		this.uiState = {
			leftSidebarOpen: true,
			rightSidebarOpen: true,
			viewMode: 'data',
			SDTM: false,
			ADaM: false
		};
	}
}

export const uiStore = UIStore.getInstance();

window.UIStore = uiStore.uiState;
