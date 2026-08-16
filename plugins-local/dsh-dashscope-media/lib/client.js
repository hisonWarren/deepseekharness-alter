window.__ModuleLoader__.load({
	id: "dsh-dashscope-media",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const { jsx, jsxs } = require("react/jsx-runtime");
		let primitives = null;
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch (_) {}

		const CSS_ID = "dsh-dashscope-media/image-gen.css";
		const css = [
			".dshImgGen{display:flex;flex-direction:column;gap:6px;margin:4px 0 8px;min-width:0}",
			".dshImgGenRow{display:flex;align-items:center;gap:6px;min-height:24px;min-width:0}",
			".dshImgGenIcon{flex:none;width:16px;height:16px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));display:inline-flex;align-items:center;justify-content:center}",
			".dshImgGenTitle{flex:none;font-size:14px;line-height:24px;color:var(--dsw-alias-label-secondary,inherit)}",
			".dshImgGenSep{flex:none;width:2px;height:2px;border-radius:1px;background:var(--dsw-alias-label-caption,rgba(127,127,127,.55));margin:0 2px}",
			".dshImgGenSummary{flex:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:24px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75))}",
			".dshImgGenSummary[data-error]{color:var(--dsw-alias-state-error-primary,#c44)}",
			".dshImgGenGallery{display:flex;flex-wrap:wrap;gap:10px;margin:2px 0 0 22px}",
			".dshImgGenFrame{position:relative;max-width:min(100%,420px);border-radius:12px;overflow:hidden;background:var(--dsw-alias-fill-swatch-1,rgba(127,127,127,.08))}",
			".dshImgGenFrame img{display:block;max-width:min(100%,420px);max-height:420px;width:auto;height:auto;object-fit:contain;cursor:zoom-in}",
			".dshImgGenPending,.dshImgGenFail{padding:12px 14px;font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75))}",
			".dshImgGenFail{color:var(--dsw-alias-state-error-primary,#c44)}",
			".dshImgGenLightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.72)}",
			".dshImgGenLightbox img{max-width:min(96vw,1200px);max-height:92vh;object-fit:contain;border-radius:8px}",
			".dshImgGenLightboxClose{position:absolute;top:16px;right:16px;appearance:none;border:0;border-radius:999px;width:32px;height:32px;cursor:pointer;background:rgba(255,255,255,.16);color:#fff;font-size:18px;line-height:32px}",
		].join("");

		function ensureCss() {
			if (typeof document === "undefined") return;
			if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]')) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-dashscope-media";
			tag.dataset.pluginCss = CSS_ID;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		function firstLine(text) {
			const s = String(text || "");
			const i = s.indexOf("\n");
			return i === -1 ? s : s.slice(0, i);
		}

		function collectImages(block) {
			const out = [];
			if (!block || !Array.isArray(block.content)) return out;
			for (const part of block.content) {
				if (part && part.type === "image" && part.attachment && part.attachment.attachmentId) {
					out.push(part.attachment);
				}
			}
			return out;
		}

		function collectSummary(block) {
			if (!block || !Array.isArray(block.content)) return "";
			const texts = [];
			for (const part of block.content) {
				if (part && part.type === "text" && typeof part.text === "string" && part.text) texts.push(part.text);
			}
			return firstLine(texts.join("\n"));
		}

		function ImageThumb({ attachment, loadImage }) {
			const [src, setSrc] = react.useState(null);
			const [error, setError] = react.useState(false);
			const [open, setOpen] = react.useState(false);

			react.useEffect(() => {
				let alive = true;
				setError(false);
				setSrc(null);
				if (typeof loadImage !== "function") {
					setError(true);
					return;
				}
				Promise.resolve(loadImage(attachment))
					.then((url) => {
						if (alive) setSrc(url);
					})
					.catch(() => {
						if (alive) setError(true);
					});
				return () => {
					alive = false;
				};
			}, [attachment, loadImage]);

			if (error) return jsx("div", { className: "dshImgGenFail", children: "图片加载失败" });
			if (!src) return jsx("div", { className: "dshImgGenPending", children: "加载中…" });
			return jsxs(react.Fragment, {
				children: [
					jsx("button", {
						type: "button",
						className: "dshImgGenFrame",
						onClick: () => setOpen(true),
						"aria-label": attachment.name || "打开原图",
						children: jsx("img", { src, alt: attachment.name || "generated image" }),
					}),
					open
						? jsxs("div", {
								className: "dshImgGenLightbox",
								role: "dialog",
								"aria-modal": "true",
								onClick: () => setOpen(false),
								children: [
									jsx("button", {
										type: "button",
										className: "dshImgGenLightboxClose",
										"aria-label": "关闭",
										onClick: () => setOpen(false),
										children: "×",
									}),
									jsx("img", {
										src,
										alt: attachment.name || "generated image",
										onClick: (event) => event.stopPropagation(),
									}),
								],
							})
						: null,
				],
			});
		}

		function ImageGenRow({ toolName, block, loadImage, t }) {
			const settled = block && "kind" in block;
			const state = !settled
				? "running"
				: block.error?.code === "interrupted"
					? "stopped"
					: block.isError
						? "error"
						: "ok";
			const images = settled ? collectImages(block) : [];
			const summary =
				state === "running"
					? "生成中…"
					: state === "error"
						? firstLine(collectSummary(block) || block.error?.message || "生成失败")
						: images.length > 0
							? images.length + " 张图片"
							: collectSummary(block) || "完成";
			const icon = primitives?.IconSparkle16
				? jsx(primitives.IconSparkle16, { size: 14 })
				: "✦";

			return jsxs("div", {
				className: "dshImgGen",
				"data-tool": toolName || "image_gen",
				"data-state": state,
				children: [
					jsxs("div", {
						className: "dshImgGenRow",
						children: [
							jsx("span", { className: "dshImgGenIcon", children: icon }),
							jsx("span", { className: "dshImgGenTitle", children: "Image" }),
							jsx("span", { className: "dshImgGenSep" }),
							jsx("span", {
								className: "dshImgGenSummary",
								"data-error": state === "error" || undefined,
								children: summary,
							}),
						],
					}),
					images.length > 0
						? jsx("div", {
								className: "dshImgGenGallery",
								children: images.map((attachment) =>
									jsx(
										ImageThumb,
										{ attachment, loadImage },
										attachment.attachmentId,
									),
								),
							})
						: null,
				],
			});
		}

		const name = "dashscope-media";
		const inject = ["slots", "sessions"];

		function apply(ctx) {
			ensureCss();
			const sessions = ctx.get("sessions");

			ctx.slots.inject("tool.call.toolview", () =>
				ctx.slots.register(
					{
						name: "tool.call.toolview",
						key: "image_gen",
						locale: "conversation",
						inject: (sessionId) => {
							const actx = sessions?.scope?.(sessionId);
							const conversation = actx?.get?.("conversation");
							return {
								loadImage: (attachment) => {
									if (!conversation?.resolveImage) {
										return Promise.reject(new Error("image service unavailable"));
									}
									return conversation.resolveImage(sessionId, attachment);
								},
							};
						},
					},
					ImageGenRow,
				),
			);
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	},
});
