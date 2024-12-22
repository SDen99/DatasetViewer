<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="./static/favicon.ico" />
</svelte:head>

{@render children()}
