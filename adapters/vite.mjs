const DEFAULT_COMPANION_ORIGIN = "http://127.0.0.1:47831";

export function v2uiBrowserAdapter(options = {}) {
  const companionOrigin = String(options.companionOrigin || DEFAULT_COMPANION_ORIGIN).replace(/\/$/, "");
  const queryParameter = options.queryParameter || "v2ui";

  return {
    name: "v2ui-codex-browser-adapter",
    apply: "serve",
    transformIndexHtml: {
      order: "post",
      handler(_html, context) {
        const requestUrl = new URL(context?.originalUrl || "/", "http://127.0.0.1");
        if (requestUrl.searchParams.get(queryParameter) !== "1") return [];
        return [{
          tag: "script",
          attrs: {
            src: `${companionOrigin}/overlay.js?surface=codex`,
            "data-v2ui-surface": "codex",
          },
          injectTo: "body",
        }];
      },
    },
  };
}

export default v2uiBrowserAdapter;
