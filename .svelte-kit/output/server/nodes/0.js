

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.B8xZovhQ.js","_app/immutable/chunks/disclose-version.XDjvWsYk.js","_app/immutable/chunks/runtime.Cjc7ESQ4.js"];
export const stylesheets = ["_app/immutable/assets/0.CsmxPz9j.css"];
export const fonts = [];
