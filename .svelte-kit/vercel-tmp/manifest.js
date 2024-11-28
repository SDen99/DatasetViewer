export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","service-worker.js"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.B7oRgcu_.js","app":"_app/immutable/entry/app.BWsZyWft.js","imports":["_app/immutable/entry/start.B7oRgcu_.js","_app/immutable/chunks/entry.eaRVKN0I.js","_app/immutable/chunks/runtime.Cjc7ESQ4.js","_app/immutable/chunks/index.ogy5EUQF.js","_app/immutable/entry/app.BWsZyWft.js","_app/immutable/chunks/runtime.Cjc7ESQ4.js","_app/immutable/chunks/store.CXBKeCe4.js","_app/immutable/chunks/disclose-version.XDjvWsYk.js","_app/immutable/chunks/index-client.C0u5BxBy.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
