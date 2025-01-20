export class UIStore {
	private static instance: UIStore;

	// State
	uiState = $state({
		leftSidebarOpen: true,
		rightSidebarOpen: true,
		SDTM: false,
		ADaM: false,
		viewMode: 'data' as 'data' | 'metadata' | 'split'
	});

	constructor() {
		// Create an effect root for store initialization

		$effect.root(() => {
			// Create effect to track UI state changes
			$effect(() => {
				$inspect('[UIStore] UI State updated:', this.uiState);
			});
		});
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

	restore(state: {
		leftSidebarOpen: boolean;
		rightSidebarOpen: boolean;
		SDTM: boolean;
		ADaM: boolean;
		viewMode: 'data' | 'metadata' | 'split';
	}) {
		this.uiState = state;
	}

	setViewMode(mode: 'data' | 'metadata' | 'split') {
		this.uiState = {
			...this.uiState,
			viewMode: mode
		};
	}

	setUIState(state: {
		leftSidebarOpen: boolean;
		rightSidebarOpen: boolean;
		SDTM: boolean;
		ADaM: boolean;
		viewMode: 'data' | 'metadata' | 'split';
	}) {
		this.uiState = state;
	}

	// Add method to get current state
	getUIState() {
		return { ...this.uiState };
	}

	// Add method to reset to defaults
	reset() {
		this.uiState = {
			leftSidebarOpen: true,
			rightSidebarOpen: true,
			SDTM: false,
			ADaM: false,
			viewMode: 'data'
		};
	}

	setDefineXMLType(isSDTM: boolean, isADaM: boolean) {
		this.uiState = {
			...this.uiState,
			SDTM: isSDTM,
			ADaM: isADaM
		};
	}
}

export const uiStore = UIStore.getInstance();
