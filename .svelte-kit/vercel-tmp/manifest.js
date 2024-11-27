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
		client: {"start":"_app/immutable/entry/start.z4cP6rYk.js","app":"_app/immutable/entry/app.BHolSNzy.js","imports":["_app/immutable/entry/start.z4cP6rYk.js","_app/immutable/chunks/entry.DckyUWfW.js","_app/immutable/chunks/runtime.D9qogIZY.js","_app/immutable/chunks/index.DdDLr5F5.js","_app/immutable/entry/app.BHolSNzy.js","_app/immutable/chunks/runtime.D9qogIZY.js","_app/immutable/chunks/store.BKD2mwAi.js","_app/immutable/chunks/disclose-version.BhQv054m.js","_app/immutable/chunks/index-client.v_smRzEr.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
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
