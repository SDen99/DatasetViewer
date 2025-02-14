import { StorageService } from '../services/StorageServices';
import type { UIState } from '$lib/core/services/StorageServices';

export class UIStore {
	private static instance: UIStore;
	private initialized = false;
	private saveTimeout: number | null = null;

	// Initialize with explicit state structure
	uiState = $state({
		leftSidebarOpen: true,
		rightSidebarOpen: true,
		leftSidebarWidth: 320,
		rightSidebarWidth: 320,
		viewMode: 'data' as const,
		SDTM: false,
		ADaM: false
	});

	private debouncedSaveState() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = window.setTimeout(() => {
			StorageService.getInstance().saveState({
				uiPreferences: this.uiState
			});
			this.saveTimeout = null;
		}, 500);
	}

	private constructor() {
		console.log('UIStore constructor - initial state:', this.uiState);

		// Load initial state from storage
		const storage = StorageService.getInstance();
		const savedState = storage.loadState();

		if (savedState.uiPreferences) {
			this.uiState = {
				...this.uiState, // Keep defaults
				...savedState.uiPreferences,
				leftSidebarWidth: savedState.uiPreferences.leftSidebarWidth ?? 320,
				rightSidebarWidth: savedState.uiPreferences.rightSidebarWidth ?? 320
			};
		}

		console.log('UIStore constructor - after loading saved state:', this.uiState);

		// Only set up the effect after initial state is loaded
		$effect.root(() => {
			$effect(() => {
				if (this.initialized) {
					console.log('Saving state:', this.uiState);
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
		const newState = {
			...this.uiState,
			[`${side}SidebarOpen`]: !this.uiState[`${side}SidebarOpen`]
		};
		console.log(`Toggling ${side} sidebar:`, newState);
		this.uiState = newState;
	}

	updateSidebarWidth(side: 'left' | 'right', width: number) {
		this.uiState = {
			...this.uiState,
			[`${side}SidebarWidth`]: width
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
			leftSidebarWidth: 320,
			rightSidebarWidth: 320,
			viewMode: 'data',
			SDTM: false,
			ADaM: false
		};
	}
}

export const uiStore = UIStore.getInstance();

window.UIStore = uiStore.uiState;
