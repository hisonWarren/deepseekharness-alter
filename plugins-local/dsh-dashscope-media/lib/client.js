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
			".dshImgGen{display:flex;flex-direction:column;gap:8px;margin:6px 0 12px;min-width:0;max-width:min(100%,520px)}",
			".dshImgGenRow{display:flex;align-items:center;gap:6px;min-height:24px;min-width:0}",
			".dshImgGenIcon{flex:none;width:16px;height:16px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));display:inline-flex;align-items:center;justify-content:center}",
			".dshImgGenTitle{flex:none;font-size:14px;line-height:24px;color:var(--dsw-alias-label-secondary,inherit)}",
			".dshImgGenSep{flex:none;width:2px;height:2px;border-radius:1px;background:var(--dsw-alias-label-caption,rgba(127,127,127,.55));margin:0 2px}",
			".dshImgGenSummary{flex:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:24px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75))}",
			".dshImgGenSummary[data-error]{color:var(--dsw-alias-state-error-primary,#c44)}",
			/* GPT-like creating / result card */
			".dshImgGenCard{position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,rgba(127,127,127,.08),rgba(127,127,127,.03));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.18));min-height:220px;display:flex;align-items:center;justify-content:center}",
			".dshImgGenCard[data-state=running]{min-height:280px}",
			".dshImgGenCreating{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:10px;width:100%;height:280px;padding:16px 18px;box-sizing:border-box;background:radial-gradient(circle at 30% 40%,rgba(77,107,254,.12),transparent 55%),radial-gradient(circle at 70% 60%,rgba(127,127,127,.1),transparent 50%)}",
			".dshImgGenCreatingLabel{font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.85))}",
			".dshImgGenDots{width:72px;height:72px;margin:auto;border-radius:50%;background:radial-gradient(circle,rgba(127,127,127,.35) 1.5px,transparent 2px) 0 0/12px 12px;opacity:.55;animation:dshImgGenPulse 1.6s ease-in-out infinite}",
			"@keyframes dshImgGenPulse{0%,100%{opacity:.35;transform:scale(.96)}50%{opacity:.7;transform:scale(1)}}",
			".dshImgGenGallery{display:flex;flex-direction:column;gap:10px;width:100%}",
			".dshImgGenFrame{appearance:none;border:0;padding:0;margin:0;display:block;width:100%;background:transparent;cursor:zoom-in;border-radius:16px;overflow:hidden}",
			".dshImgGenFrame img{display:block;width:100%;max-height:min(72vh,640px);height:auto;object-fit:contain;background:var(--dsw-alias-fill-swatch-1,rgba(127,127,127,.06))}",
			".dshImgGenActions{display:flex;align-items:center;gap:8px;padding:0 2px}",
			".dshImgGenAction{appearance:none;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;height:28px;padding:0 12px;font-size:12px;line-height:28px;cursor:pointer}",
			".dshImgGenAction:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1));color:var(--dsw-alias-label-primary,inherit)}",
			".dshImgGenPending,.dshImgGenFail{padding:16px 18px;font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75))}",
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

		function parseToolValue(block) {
			if (!block || !Array.isArray(block.content)) return null;
			if (block.value && typeof block.value === "object") return block.value;
			for (const part of block.content) {
				if (!(part && part.type === "text" && typeof part.text === "string")) continue;
				const text = part.text;
				if (text.startsWith("__dsh_media__")) {
					try {
						return JSON.parse(text.slice("__dsh_media__".length));
					} catch (_) {}
				}
				try {
					const parsed = JSON.parse(text);
					if (parsed && typeof parsed === "object") return parsed;
				} catch (_) {}
			}
			return null;
		}

		function collectSlots(block) {
			const attachments = [];
			const files = [];
			if (!block || !Array.isArray(block.content)) return { attachments, files };
			for (const part of block.content) {
				if (part && part.type === "image" && part.attachment && part.attachment.attachmentId) {
					attachments.push(part.attachment);
				}
			}
			const value = parseToolValue(block);
			const images = (value && value.images) || [];
			for (const img of images) {
				if (img && img.ok && img.file) files.push(img.file);
				if (img && img.attachment && img.attachment.attachmentId) {
					const id = img.attachment.attachmentId;
					if (!attachments.some((a) => a.attachmentId === id)) attachments.push(img.attachment);
				}
			}
			return { attachments, files };
		}

		function collectSummary(block) {
			if (!block || !Array.isArray(block.content)) return "";
			const texts = [];
			for (const part of block.content) {
				if (part && part.type === "text" && typeof part.text === "string" && part.text) {
					if (part.text.trim().startsWith("{") || part.text.startsWith("__dsh_media__")) continue;
					texts.push(part.text);
				}
			}
			return firstLine(texts.join("\n"));
		}

		function mediaFileUrl(sessionId, cwd, filePath) {
			const params = new URLSearchParams({ sessionId, path: filePath });
			if (cwd) params.set("cwd", cwd);
			return "/sidebar/file?" + params.toString();
		}

		function ImageCard({ src, alt, downloadHref }) {
			const [open, setOpen] = react.useState(false);
			const [error, setError] = react.useState(false);
			if (error || !src) {
				return jsx("div", { className: "dshImgGenFail", children: error ? "图片加载失败" : "加载中…" });
			}
			return jsxs("div", {
				className: "dshImgGenGallery",
				children: [
					jsx("div", {
						className: "dshImgGenCard",
						children: jsx("button", {
							type: "button",
							className: "dshImgGenFrame",
							onClick: () => setOpen(true),
							"aria-label": alt || "打开原图",
							children: jsx("img", {
								src,
								alt: alt || "generated image",
								onError: () => setError(true),
							}),
						}),
					}),
					downloadHref
						? jsx("div", {
								className: "dshImgGenActions",
								children: jsx("a", {
									className: "dshImgGenAction",
									href: downloadHref,
									download: true,
									children: "下载",
								}),
							})
						: null,
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
										alt: alt || "generated image",
										onClick: (event) => event.stopPropagation(),
									}),
								],
							})
						: null,
				],
			});
		}

		function AttachmentCard({ attachment, loadImage }) {
			const [src, setSrc] = react.useState(null);
			const [error, setError] = react.useState(false);
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
			if (!src) {
				return jsx("div", {
					className: "dshImgGenCard",
					"data-state": "running",
					children: jsxs("div", {
						className: "dshImgGenCreating",
						children: [
							jsx("div", { className: "dshImgGenCreatingLabel", children: "正在加载图片" }),
							jsx("div", { className: "dshImgGenDots", "aria-hidden": true }),
						],
					}),
				});
			}
			return jsx(ImageCard, { src, alt: attachment.name || "generated image" });
		}

		function FileCard({ file, sessionId, cwd }) {
			const src = mediaFileUrl(sessionId, cwd, file);
			const download = src + (src.includes("?") ? "&" : "?") + "download=1";
			return jsx(ImageCard, { src, alt: file.split(/[/\\]/).pop(), downloadHref: download });
		}

		function ImageGenRow({ toolName, block, loadImage, sessionId, useSessions }) {
			const settled = block && "kind" in block;
			const state = !settled
				? "running"
				: block.error?.code === "interrupted"
					? "stopped"
					: block.isError
						? "error"
						: "ok";
			const cwd = typeof useSessions === "function" ? useSessions((list) => list?.byId?.[sessionId]?.cwd) : undefined;
			const slots = settled ? collectSlots(block) : { attachments: [], files: [] };
			const summary =
				state === "running"
					? "正在创建图片"
					: state === "error"
						? firstLine(collectSummary(block) || block.error?.message || "生成失败")
						: slots.attachments.length + slots.files.length > 0
							? "已生成"
							: collectSummary(block) || "完成";
			const icon = primitives?.IconSparkle16
				? jsx(primitives.IconSparkle16, { size: 14 })
				: "✦";

			let body = null;
			if (state === "running") {
				body = jsx("div", {
					className: "dshImgGenCard",
					"data-state": "running",
					children: jsxs("div", {
						className: "dshImgGenCreating",
						children: [
							jsx("div", { className: "dshImgGenCreatingLabel", children: "正在创建图片" }),
							jsx("div", { className: "dshImgGenDots", "aria-hidden": true }),
						],
					}),
				});
			} else if (slots.attachments.length > 0) {
				body = jsxs("div", {
					className: "dshImgGenGallery",
					children: slots.attachments.map((attachment) =>
						jsx(AttachmentCard, { attachment, loadImage }, attachment.attachmentId),
					),
				});
			} else if (slots.files.length > 0 && sessionId) {
				body = jsxs("div", {
					className: "dshImgGenGallery",
					children: slots.files.map((file) =>
						jsx(FileCard, { file, sessionId, cwd }, file),
					),
				});
			}

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
					body,
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
								sessionId,
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
