window.__ModuleLoader__.load({
	id: "dsh-ux-polish",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const { jsx, jsxs, Fragment } = require("react/jsx-runtime");

		const CSS_ID = "dsh-ux-polish/style.css";
		const css = [
			'.Md3f7G_flowItem:has([data-context-source="user-approval"]){display:none!important}',
			'[data-context-source="user-approval"]{display:none!important}',
			'[data-command-name="permission"]{display:none!important}',
			".dshUxUser{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:0}",
			".dshUxBubble{max-width:min(100%,var(--dsh-chat-content-width,720px));padding:10px 14px;border-radius:18px;background:var(--dsw-alias-fill-swatch-1,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,inherit);font:var(--dsw-font-m-16,14px/1.5);white-space:pre-wrap;word-break:break-word}",
			".dshUxBubble.is-editing{width:min(100%,560px);padding:0;background:transparent}",
			".dshUxEdit{width:100%;min-height:88px;max-height:40vh;resize:vertical;box-sizing:border-box;padding:10px 14px;border-radius:18px;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));background:var(--dsw-alias-bg-primary,transparent);color:inherit;font:inherit;line-height:1.5}",
			".dshUxEdit:focus{outline:2px solid var(--dsw-static-deepseek-500,#4d6bfe);outline-offset:1px}",
			".dshUxActions{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-right:2px}",
			".dshUxBtn{appearance:none;border:0;background:transparent;color:inherit;opacity:.72;cursor:pointer;padding:4px 8px;font-size:12px;line-height:1.2;border-radius:6px}",
			".dshUxBtn:hover{opacity:1;background:rgba(127,127,127,.12)}",
			".dshUxBtn:disabled{opacity:.4;cursor:default}",
			".dshUxBtnPrimary{opacity:1;background:var(--dsw-static-deepseek-500,#4d6bfe);color:#fff}",
			".dshUxBtnPrimary:hover{filter:brightness(1.05)}",
			".dshUxHint{max-width:min(100%,560px);font-size:12px;line-height:1.35;color:var(--dsw-alias-label-caption,rgba(127,127,127,.85));text-align:right}",
			".dshUxErr{max-width:min(100%,560px);font-size:12px;line-height:1.35;color:var(--dsw-alias-state-error-primary,#c44);text-align:right}",
			".dshUxMeta{font-size:11px;opacity:.55;margin-right:4px}",
		].join("");

		function ensureCss() {
			if (typeof document === "undefined") return;
			if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]')) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-ux-polish";
			tag.dataset.pluginCss = CSS_ID;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		function contentText(content) {
			if (!Array.isArray(content)) return String(content ?? "");
			const parts = [];
			for (const block of content) {
				if (block && block.type === "text" && typeof block.text === "string") parts.push(block.text);
			}
			return parts.join("");
		}

		function contentHasImages(content) {
			if (!Array.isArray(content)) return false;
			return content.some((block) => block && block.type === "image");
		}

		/** Closest completed-turn anchor strictly before this user message. */
		function previousTurnForkSeq(snapshot, userSeq) {
			let best = null;
			const nodes = snapshot?.chat?.nodes;
			if (!nodes || typeof nodes.values !== "function") return null;
			for (const node of nodes.values()) {
				let seq = null;
				if (node?.kind === "turn-tail") {
					seq = node.data?.closing?.finalNode?.seq ?? node.data?.seq;
				} else if (node?.kind === "assistant-step") {
					seq = node.data?.finalNode?.seq ?? node.data?.seq;
				}
				if (typeof seq !== "number" || !(seq < userSeq)) continue;
				if (best === null || seq > best) best = seq;
			}
			return best;
		}

		async function waitForSession(sessions, sessionId, attempts = 30) {
			for (let i = 0; i < attempts; i++) {
				const session = sessions.binding?.(sessionId)?.session;
				if (session?.prompt) return session;
				await new Promise((r) => setTimeout(r, 50));
			}
			return null;
		}

		function hasLaterChat(snapshot, userSeq) {
			const nodes = snapshot?.chat?.nodes;
			if (!nodes || typeof nodes.values !== "function") return false;
			for (const node of nodes.values()) {
				const seq = node?.data?.seq;
				if (typeof seq === "number" && seq > userSeq) {
					if (
						node.kind === "user" ||
						node.kind === "steering" ||
						node.kind === "turn-tail" ||
						node.kind === "assistant-step" ||
						node.kind === "tool-call"
					) {
						return true;
					}
				}
			}
			return false;
		}

		async function copyText(text) {
			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text);
					return true;
				}
			} catch (_) {}
			try {
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.style.position = "fixed";
				ta.style.left = "-9999px";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				ta.remove();
				return true;
			} catch (_) {
				return false;
			}
		}

		function QuietPermissionCommand() {
			return null;
		}

		function EditableUserMessage(props) {
			const { node, sessionId, useSession, t: _t } = props;
			const sessions = props.__sessions;
			const data = node?.data ?? {};
			const original = contentText(data.content);
			const userSeq = typeof data.seq === "number" ? data.seq : 0;
			const hasImages = contentHasImages(data.content);

			const [editing, setEditing] = react.useState(false);
			const [draft, setDraft] = react.useState(original);
			const [busy, setBusy] = react.useState(false);
			const [copied, setCopied] = react.useState(false);
			const [error, setError] = react.useState("");
			const textareaRef = react.useRef(null);

			const forkSeq = useSession((snapshot) => previousTurnForkSeq(snapshot, userSeq));
			const later = useSession((snapshot) => hasLaterChat(snapshot, userSeq));

			react.useEffect(() => {
				if (!editing) return;
				const el = textareaRef.current;
				if (!el) return;
				el.focus();
				el.setSelectionRange(el.value.length, el.value.length);
			}, [editing]);

			const onStartEdit = () => {
				setDraft(original);
				setError("");
				setEditing(true);
			};

			const onCancel = () => {
				if (busy) return;
				setEditing(false);
				setDraft(original);
				setError("");
			};

			const onCopy = async () => {
				const ok = await copyText(original);
				if (!ok) return;
				setCopied(true);
				setTimeout(() => setCopied(false), 1200);
			};

			const onSubmit = async () => {
				const text = draft.trimEnd();
				if (!text.trim() || busy) return;
				if (!sessions || !sessionId) {
					setError("无法访问会话服务，请刷新后重试。");
					return;
				}
				setBusy(true);
				setError("");
				try {
					let childId;
					if (forkSeq === null) {
						const source = sessions.list?.getSnapshot?.()?.byId?.[sessionId];
						const createOpts = {};
						if (source?.cwd) createOpts.cwd = source.cwd;
						childId = await sessions.create(createOpts);
					} else {
						childId = await sessions.fork({
							sessionId,
							atSeq: forkSeq,
							increaseTitle: true,
						});
					}
					sessions.open(childId);
					const session = await waitForSession(sessions, childId);
					if (!session) throw new Error("分支会话尚未就绪，请手动打开新对话后发送。");
					const result = await session.prompt([{ type: "text", text }], "queue");
					if (result && result.ok === false) {
						const err = result.error;
						throw new Error(err?.message || err?.code || "发送失败");
					}
					setEditing(false);
				} catch (e) {
					const msg = e?.message || String(e);
					if (/fork-unavailable|unavailable/i.test(msg)) {
						setError("本轮尚未结束，请等待助手回复完成后再编辑。");
					} else {
						setError(msg || "编辑失败");
					}
					// Soft fallback: put text in composer of current session
					try {
						props.inputActions?.setDraft?.(text);
					} catch (_) {}
				} finally {
					setBusy(false);
				}
			};

			const onKeyDown = (e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onCancel();
					return;
				}
				if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
					e.preventDefault();
					onSubmit();
				}
			};

			const hint = forkSeq === null
				? "将新建对话并发送修改后的消息（当前为首轮）。"
				: later
					? "将分支到新对话：保留此前轮次，丢弃本条及之后的消息。"
					: "将分支到新对话：保留此前轮次，用修改后的消息重新生成。";

			return jsxs("div", {
				className: "dshUxUser",
				"data-dsh-ux-user": "",
				"data-time-hover-root": true,
				children: [
					jsxs("div", {
						className: editing ? "dshUxBubble is-editing" : "dshUxBubble",
						children: editing
							? jsx("textarea", {
									ref: textareaRef,
									className: "dshUxEdit",
									value: draft,
									disabled: busy,
									onChange: (e) => setDraft(e.target.value),
									onKeyDown,
									"aria-label": "编辑消息",
								})
							: original || jsx("span", { style: { opacity: 0.5 }, children: "（空消息）" }),
					}),
					editing
						? jsxs(Fragment, {
								children: [
									jsx("div", { className: "dshUxHint", children: hint }),
									hasImages
										? jsx("div", {
												className: "dshUxHint",
												children: "原消息含图片：重新发送时不会自动附带图片。",
											})
										: null,
									error ? jsx("div", { className: "dshUxErr", children: error }) : null,
									jsxs("div", {
										className: "dshUxActions",
										children: [
											jsx("button", {
												type: "button",
												className: "dshUxBtn",
												disabled: busy,
												onClick: onCancel,
												children: "取消",
											}),
											jsx("button", {
												type: "button",
												className: "dshUxBtn dshUxBtnPrimary",
												disabled: busy || !draft.trim(),
												onClick: onSubmit,
												children: busy ? "处理中…" : "发送",
											}),
										],
									}),
								],
							})
						: jsxs("div", {
								className: "dshUxActions",
								children: [
									typeof data.time === "number"
										? jsx("span", {
												className: "dshUxMeta",
												children: new Date(data.time).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												}),
											})
										: null,
									jsx("button", {
										type: "button",
										className: "dshUxBtn",
										title: "复制",
										onClick: onCopy,
										children: copied ? "已复制" : "复制",
									}),
									jsx("button", {
										type: "button",
										className: "dshUxBtn",
										title: "就地编辑并分支到新对话（类似 ChatGPT）",
										onClick: onStartEdit,
										children: "编辑",
									}),
								],
							}),
				],
			});
		}

		const name = "ux-polish";
		const inject = ["slots", "sessions"];

		function apply(ctx) {
			ensureCss();
			const sessions = ctx.get("sessions");

			const UserView = react.memo(function UserView(props) {
				return jsx(EditableUserMessage, { ...props, __sessions: sessions });
			});

			// Shadow shipped user/steering renderers: same key + same priority throws;
			// lower priority wins ("lowest renders").
			ctx.slots.inject("conversation.chat.node", () =>
				ctx.slots.register(
					{ name: "conversation.chat.node", key: "user", priority: -10 },
					UserView,
				),
			);
			ctx.slots.inject("conversation.chat.node", () =>
				ctx.slots.register(
					{ name: "conversation.chat.node", key: "steering", priority: -10 },
					UserView,
				),
			);

			ctx.slots.inject("conversation.chat.commandview", () =>
				ctx.slots.register(
					{ name: "conversation.chat.commandview", key: "permission", priority: -10 },
					QuietPermissionCommand,
				),
			);
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	},
});
