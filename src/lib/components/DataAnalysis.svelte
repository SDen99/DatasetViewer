<script lang="ts">
	import { tableUIStore } from '$lib/stores/tableUIStore.svelte';
	import { datasetStore } from '$lib/stores/datasetStore.svelte';
	import { Barcode } from 'svelte-lucide';
	import * as Card from '$lib/components/ui/card';

	// Define interfaces for better type safety
	interface NumericStats {
		type: 'numeric';
		count: number;
		mean: number;
		min: number;
		max: number;
		nullCount: number;
		median: number;
		q1: number;
		q3: number;
	}

	interface CategoricalStats {
		type: 'categorical';
		count: number;
		nullCount: number;
		unique: number;
		topValues: [string, number][];
	}

	type ColumnStats = NumericStats | CategoricalStats;

	// Track selected column for analysis
	let selectedColumn = $state<string | null>(null);

	// Computed statistics with proper typing
	let columnStats = $derived.by((): ColumnStats | null => {
		if (!selectedColumn || !datasetStore.selectedDatasetId) return null;

		const dataset = datasetStore.datasets[datasetStore.selectedDatasetId];
		const data = dataset.data;
		const values: unknown[] = data
			.map((row: Record<string, unknown>) => row[selectedColumn])
			.filter((v): v is NonNullable<unknown> => v != null);

		if (values.length === 0) return null;

		// Basic statistics
		const numericValues = values.map((v) => Number(v)).filter((v): v is number => !isNaN(v));

		if (numericValues.length > 0) {
			return {
				type: 'numeric',
				count: values.length,
				mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
				min: Math.min(...numericValues),
				max: Math.max(...numericValues),
				nullCount: data.length - values.length,
				median: calculateMedian(numericValues),
				q1: calculateQuartile(numericValues, 0.25),
				q3: calculateQuartile(numericValues, 0.75)
			};
		}

		// For categorical data
		const valueCounts = values.reduce<Record<string, number>>((acc, val) => {
			const key = String(val);
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});

		return {
			type: 'categorical',
			count: values.length,
			nullCount: data.length - values.length,
			unique: Object.keys(valueCounts).length,
			topValues: Object.entries(valueCounts)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
		};
	});

	function calculateMedian(values: number[]): number {
		const sorted = [...values].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
	}

	function calculateQuartile(values: number[], percentile: number): number {
		const sorted = [...values].sort((a, b) => a - b);
		const pos = (sorted.length - 1) * percentile;
		const base = Math.floor(pos);
		const rest = pos - base;
		if (base + 1 < sorted.length) {
			return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
		}
		return sorted[base];
	}

	interface HistogramData {
		bins: number[];
		binSize: number;
		min: number;
		max: number;
	}

	let histogramData = $derived.by((): HistogramData | null => {
		if (
			!columnStats ||
			columnStats.type !== 'numeric' ||
			!selectedColumn ||
			!datasetStore.selectedDatasetId
		) {
			return null;
		}

		const dataset = datasetStore.datasets[datasetStore.selectedDatasetId];
		const values = dataset.data
			.map((row: Record<string, unknown>) => Number(row[selectedColumn]))
			.filter((v): v is number => !isNaN(v));

		// Create 10 bins
		const binCount = 10;
		const min = Math.min(...values);
		const max = Math.max(...values);
		const binSize = (max - min) / binCount;

		const bins = Array(binCount).fill(0);
		values.forEach((v) => {
			const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1);
			bins[binIndex]++;
		});

		return {
			bins,
			binSize,
			min,
			max
		};
	});
</script>

<div class="space-y-4 p-4">
	<div class="space-y-2">
		<label for="column-select" class="text-sm font-medium">Select Column for Analysis</label>
		<select id="column-select" bind:value={selectedColumn} class="w-full rounded-md border p-2">
			<option value={null}>Select a column...</option>
			{#each [...tableUIStore.selectedColumns] as column}
				<option value={column}>{column}</option>
			{/each}
		</select>
	</div>

	{#if columnStats}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">Column Statistics</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					<div class="grid grid-cols-2 gap-2">
						<div class="text-sm text-muted-foreground">Total Count</div>
						<div class="text-sm font-medium">{columnStats.count}</div>
						<div class="text-sm text-muted-foreground">Null Count</div>
						<div class="text-sm font-medium">{columnStats.nullCount}</div>
					</div>

					{#if columnStats.type === 'numeric'}
						<div class="mt-4 grid grid-cols-2 gap-2">
							<div class="text-sm text-muted-foreground">Mean</div>
							<div class="text-sm font-medium">{columnStats.mean.toFixed(2)}</div>
							<div class="text-sm text-muted-foreground">Median</div>
							<div class="text-sm font-medium">{columnStats.median.toFixed(2)}</div>
							<div class="text-sm text-muted-foreground">Min</div>
							<div class="text-sm font-medium">{columnStats.min.toFixed(2)}</div>
							<div class="text-sm text-muted-foreground">Max</div>
							<div class="text-sm font-medium">{columnStats.max.toFixed(2)}</div>
							<div class="text-sm text-muted-foreground">Q1</div>
							<div class="text-sm font-medium">{columnStats.q1.toFixed(2)}</div>
							<div class="text-sm text-muted-foreground">Q3</div>
							<div class="text-sm font-medium">{columnStats.q3.toFixed(2)}</div>
						</div>

						{#if histogramData}
							<div class="mt-4">
								<div class="text-sm font-medium">Distribution</div>
								<div class="mt-2 h-32">
									<div class="flex h-full items-end gap-1">
										{#each histogramData.bins as count, i}
											{@const height = (count / Math.max(...histogramData.bins)) * 100}
											{@const start = histogramData.min + i * histogramData.binSize}
											{@const end = start + histogramData.binSize}
											<div
												class="flex-1 bg-primary/20 transition-colors hover:bg-primary/30"
												style="height: {height}%"
												title={`${start.toFixed(1)} - ${end.toFixed(1)}: ${count}`}
											></div>
										{/each}
									</div>
								</div>
							</div>
						{/if}
					{:else}
						<div class="mt-4">
							<div class="text-sm font-medium">Top Values</div>
							<div class="mt-2 space-y-1">
								{#each columnStats.topValues as [value, count]}
									<div class="flex items-center justify-between">
										<span class="text-sm">{value}</span>
										<span class="text-sm text-muted-foreground">{count}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
