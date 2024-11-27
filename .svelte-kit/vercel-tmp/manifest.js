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
		client: {"start":"_app/immutable/entry/start.BDq4F7Dh.js","app":"_app/immutable/entry/app.WcgWbLDQ.js","imports":["_app/immutable/entry/start.BDq4F7Dh.js","_app/immutable/chunks/entry.CrwLFJIn.js","_app/immutable/chunks/runtime.DoilE01P.js","_app/immutable/chunks/index.DFqX7hCa.js","_app/immutable/entry/app.WcgWbLDQ.js","_app/immutable/chunks/runtime.DoilE01P.js","_app/immutable/chunks/store.DDH_-z5m.js","_app/immutable/chunks/disclose-version.xvGZuHic.js","_app/immutable/chunks/index-client.Cd-buOrY.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
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
