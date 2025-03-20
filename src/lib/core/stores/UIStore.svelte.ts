import { StorageService } from '../services/StorageServices';

export interface UIState {
	leftSidebarOpen: boolean;
	rightSidebarOpen: boolean;
	leftSidebarWidth: number;
	rightSidebarWidth: number;

	viewMode: 'data' | 'metadata' | 'VLM';
	SDTM: boolean;
	ADaM: boolean;
	metadataViewMode: 'table' | 'card';
}

export class UIStore {
	private static instance: UIStore;
	private initialized = false;
	private saveTimeout: number | null = null;

	// Initialize with explicit state structure
	uiState = $state<UIState>({
		leftSidebarOpen: true,
		rightSidebarOpen: false,
		leftSidebarWidth: 250,
		rightSidebarWidth: 300,
		viewMode: 'data',
		SDTM: false,
		ADaM: false,
		metadataViewMode: 'table'
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
				rightSidebarWidth: savedState.uiPreferences.rightSidebarWidth ?? 320,
				metadataViewMode: savedState.uiPreferences.metadataViewMode ?? 'table'
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

	setDefineXMLType(hasSDTM: boolean, hasADaM: boolean): void {
		// Preserve existing values (don't overwrite true with false)
		const newSDTM = hasSDTM || this.uiState.SDTM;
		const newADaM = hasADaM || this.uiState.ADaM;

		this.uiState = {
			...this.uiState,
			SDTM: newSDTM,
			ADaM: newADaM
		};

		console.log({
			event: 'UIStore: Define XML types updated',
			SDTM: newSDTM,
			ADaM: newADaM
		});
	}

	setMetadataViewMode(mode: 'table' | 'card') {
		this.uiState = {
			...this.uiState,
			metadataViewMode: mode
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
			ADaM: false,
			metadataViewMode: 'table'
		};
	}
}

export const uiStore = UIStore.getInstance();

window.UIStore = uiStore.uiState;
