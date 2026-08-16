window.__ModuleLoader__.load({
	id: "dsh-ux-polish",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
		let primitives = null;
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch (_) {}

		const CSS_ID = "dsh-ux-polish/style.css";
		const css = [
			/* Quiet approval chrome */
			'.Md3f7G_flowItem:has([data-context-source="user-approval"]){display:none!important}',
			'[data-context-source="user-approval"]{display:none!important}',
			'[data-command-name="permission"]{display:none!important}',
			/* Hide Todo/plan strip — Cursor queue is the metaphor, not pre-scheduled tasks */
			'[data-testid="todo-panel"]{display:none!important}',
			/* When Cursor queue-primary is active, hide stock Stop (svg rect affordance) */
			'html[data-dsh-cursor-queue] [data-composer-card] button:has(svg rect[width="10"]):not([data-dsh-ux-ctrl]){display:none!important}',
			/* User bubble edit chrome */
			".dshUxUser{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:0}",
			".dshUxBubble{max-width:min(100%,var(--dsh-chat-content-width,720px));padding:10px 14px;border-radius:18px;background:var(--dsw-alias-fill-swatch-1,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,inherit);font:var(--dsw-font-m-16,14px/1.5);white-space:pre-wrap;word-break:break-word}",
			".dshUxBubble.is-editing{width:min(100%,560px);padding:0;background:transparent}",
			".dshUxEdit{width:100%;min-height:88px;max-height:40vh;resize:vertical;box-sizing:border-box;padding:10px 14px;border-radius:18px;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));background:var(--dsw-alias-bg-primary,transparent);color:inherit;font:inherit;line-height:1.5}",
			".dshUxEdit:focus{outline:2px solid var(--dsw-static-deepseek-500,#4d6bfe);outline-offset:1px}",
			".dshUxActions{display:flex;flex-wrap:wrap;align-items:center;gap:2px;margin-right:2px}",
			".dshUxBtn{appearance:none;border:0;background:transparent;color:inherit;opacity:.72;cursor:pointer;padding:4px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;line-height:0}",
			".dshUxBtn:hover{opacity:1;background:rgba(127,127,127,.12)}",
			".dshUxBtn:disabled{opacity:.4;cursor:default}",
			".dshUxBtnPrimary{opacity:1;width:auto;height:auto;padding:4px 10px;font-size:12px;line-height:1.2;background:var(--dsw-static-deepseek-500,#4d6bfe);color:#fff}",
			".dshUxBtnPrimary:hover{filter:brightness(1.05)}",
			".dshUxBtnText{width:auto;height:auto;padding:4px 8px;font-size:12px;line-height:1.2}",
			".dshUxHint{max-width:min(100%,560px);font-size:12px;line-height:1.35;color:var(--dsw-alias-label-caption,rgba(127,127,127,.85));text-align:right}",
			".dshUxErr{max-width:min(100%,560px);font-size:12px;line-height:1.35;color:var(--dsw-alias-state-error-primary,#c44);text-align:right}",
			".dshUxMeta{font-size:11px;opacity:.55;margin-right:6px}",
			".dshUxIcon{width:16px;height:16px;display:block}",
			/* Cursor-like primary morph controls (sit in input.right, before hidden Stop) */
			".dshUxCursorCtrls{display:inline-flex;align-items:center;gap:6px;margin-left:4px}",
			".dshUxCursorStop,.dshUxCursorQueue{appearance:none;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;line-height:0;transition:background-color .12s ease,opacity .12s ease,transform .12s ease}",
			".dshUxCursorStop{width:28px;height:28px;border-radius:8px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.9));background:transparent}",
			".dshUxCursorStop:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,inherit)}",
			".dshUxCursorQueue{width:32px;height:32px;border-radius:999px;color:#fff;background:var(--dsw-static-deepseek-500,#4d6bfe);box-shadow:0 1px 2px rgba(0,0,0,.12)}",
			".dshUxCursorQueue:hover{filter:brightness(1.06);transform:translateY(-0.5px)}",
			".dshUxCursorQueue:active{transform:translateY(0)}",
			".dshUxCursorQueue:disabled,.dshUxCursorStop:disabled{opacity:.45;cursor:default;transform:none}",
			/* Cursor-like queue strip — width matches composer card */
			".dshUxQDock{box-sizing:border-box;width:calc(100% - 2 * var(--dsh-composer-side-clearance,16px));max-width:var(--dsh-composer-card-max-width);margin:0 auto calc(0px - var(--dsh-composer-stack-gap,8px) - 2px);padding:0;flex:none}",
			".dshUxQPanel{position:relative;width:100%;overflow:hidden;border-radius:12px 12px 0 0;background:var(--dsw-specific-tip,var(--dsw-alias-bg-elevated,rgba(127,127,127,.06)));padding:2px 0}",
			'.dshUxQPanel:after{content:"";pointer-events:none;position:absolute;inset:0;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.22));border-bottom:none;border-radius:inherit}',
			".dshUxQHeader{box-sizing:border-box;width:100%;height:34px;display:flex;align-items:center;gap:8px;padding:4px 12px;margin:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,inherit);text-align:left;cursor:pointer;font:inherit}",
			".dshUxQHeader:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}",
			".dshUxQHeader:disabled{cursor:default}",
			".dshUxQLead{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7))}",
			".dshUxQCount{flex:auto;min-width:0;font-size:13px;font-weight:600;line-height:20px;letter-spacing:.01em}",
			".dshUxQChevron{flex:none;width:14px;height:14px;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7))}",
			".dshUxQList{list-style:none;margin:0;padding:0;max-height:180px;overflow-y:auto}",
			".dshUxQRow{box-sizing:border-box;width:100%;height:36px;display:flex;align-items:center;gap:10px;padding:4px 8px 4px 12px;border-radius:8px}",
			".dshUxQRow+.dshUxQRow{box-shadow:inset 0 1px 0 var(--dsw-alias-border-l1,rgba(127,127,127,.18))}",
			".dshUxQDot{flex:none;width:8px;height:8px;border-radius:999px;background:var(--dsw-alias-label-tertiary,rgba(127,127,127,.45))}",
			".dshUxQPreview{flex:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:var(--dsw-font-xs-13,13px/20px);color:var(--dsw-alias-label-primary-dimmed,rgba(127,127,127,.88))}",
			".dshUxQEditor{flex:auto;min-width:0;box-sizing:border-box;height:28px;padding:0 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,inherit);outline:none;font:inherit}",
			".dshUxQEditor:focus{border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}",
			".dshUxQActions{flex:none;display:flex;align-items:center;gap:4px}",
			".dshUxQAction{appearance:none;border:0;background:transparent;width:28px;height:28px;border-radius:999px;display:grid;place-items:center;padding:0;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75));cursor:pointer}",
			".dshUxQAction:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,inherit)}",
			".dshUxQAction:disabled{opacity:.45;cursor:default}",
		].join("");

		function IconCopy({ checked }) {
			if (primitives) {
				const Comp = checked ? primitives.IconCheckOutline16 : primitives.IconCopyOutline16;
				if (Comp) return jsx(Comp, {});
			}
			if (checked) {
				return jsx("svg", {
					className: "dshUxIcon",
					viewBox: "0 0 16 16",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					"aria-hidden": true,
					children: jsx("path", { d: "M3.5 8.5 6.5 11.5 12.5 4.5" }),
				});
			}
			return jsx("svg", {
				className: "dshUxIcon",
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": true,
				children: [
					jsx("rect", { x: "5.5", y: "5.5", width: "8", height: "8", rx: "1.5" }),
					jsx("path", { d: "M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" }),
				],
			});
		}

		function IconEdit() {
			if (primitives?.IconEditOutline16) return jsx(primitives.IconEditOutline16, { size: 16 });
			return jsx("svg", {
				className: "dshUxIcon",
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": true,
				children: [
					jsx("path", { d: "m3.5 12.5 1.2-4.2L11 2.5l2.5 2.5-6.3 6.3-4.2 1.2Z" }),
					jsx("path", { d: "m9.8 3.7 2.5 2.5" }),
				],
			});
		}

		function IconQueueArrow() {
			return jsx("svg", {
				className: "dshUxIcon",
				viewBox: "0 0 16 16",
				width: 16,
				height: 16,
				"aria-hidden": true,
				children: jsx("path", {
					fill: "currentColor",
					d: "M8.3125 0.980183C8.66767 1.0531 8.97902 1.20418 9.2627 1.43233C9.48724 1.61297 9.73029 1.85793 9.97949 2.10714L14.707 6.83468L13.293 8.24874L9 3.95577V15.0417H7V3.95577L2.70703 8.24874L1.29297 6.83468L6.02051 2.10714C6.26971 1.85793 6.51277 1.61297 6.7373 1.43233C6.97662 1.23986 7.28445 1.04402 7.6875 0.980183C7.8973 0.947006 8.1031 0.95516 8.3125 0.980183Z",
				}),
			});
		}

		function IconStopSquare() {
			return jsx("svg", {
				viewBox: "0 0 16 16",
				width: 14,
				height: 14,
				"aria-hidden": true,
				children: jsx("rect", { x: "3", y: "3", width: "10", height: "10", rx: "3", fill: "currentColor" }),
			});
		}

		function IconChevron({ up }) {
			if (up && primitives?.IconChevronUpOutline14) return jsx(primitives.IconChevronUpOutline14, {});
			if (!up && primitives?.IconChevronDownOutline14) return jsx(primitives.IconChevronDownOutline14, {});
			return jsx("svg", {
				viewBox: "0 0 14 14",
				width: 14,
				height: 14,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": true,
				children: jsx("path", { d: up ? "M3.5 9 7 5.5 10.5 9" : "M3.5 5 7 8.5 10.5 5" }),
			});
		}

		function IconTrash() {
			if (primitives?.IconTrashOutline16) return jsx(primitives.IconTrashOutline16, { size: 14 });
			return jsx("svg", {
				viewBox: "0 0 16 16",
				width: 14,
				height: 14,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": true,
				children: [
					jsx("path", { d: "M3 4.5h10" }),
					jsx("path", { d: "M6 4.5V3.5A1 1 0 0 1 7 2.5h2a1 1 0 0 1 1 1v1" }),
					jsx("path", { d: "M5 4.5l.6 8a1 1 0 0 0 1 .9h2.8a1 1 0 0 0 1-.9l.6-8" }),
				],
			});
		}

		function IconCheck() {
			if (primitives?.IconCheckOutline16) return jsx(primitives.IconCheckOutline16, { size: 14 });
			return jsx("svg", {
				viewBox: "0 0 16 16",
				width: 14,
				height: 14,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": true,
				children: jsx("path", { d: "M3.5 8.5 6.5 11.5 12.5 4.5" }),
			});
		}

		function IconClose() {
			if (primitives?.IconCloseOutline16) return jsx(primitives.IconCloseOutline16, { size: 14 });
			return jsx("svg", {
				viewBox: "0 0 16 16",
				width: 14,
				height: 14,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": true,
				children: jsx("path", { d: "M4 4 12 12M12 4 4 12" }),
			});
		}

		function IconSteerSend() {
			if (primitives?.IconSendOutline14) return jsx(primitives.IconSendOutline14, {});
			return jsx(IconQueueArrow, {});
		}

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

		/**
		 * Cursor-style primary morph: while agent is running and the draft is
		 * non-empty, replace stock Stop with Queue↑ (+ compact Stop still reachable).
		 * Click uses inputActions.submit() → always queue (matches core contract).
		 */
		function CursorQueueSend(props) {
			const sessions = props.__sessions;
			const { useSession, useInput, inputActions, sessionId } = props;
			const running = useSession ? useSession((s) => s.running) : false;
			const subagent = useSession ? useSession((s) => s.subagent) : null;
			const draft = useInput ? useInput((s) => s.draft) : "";
			const phase = useInput ? useInput((s) => s.phase) : "idle";
			const machineBusy = phase === "adjudicating" || phase === "submitting";
			const empty = !String(draft ?? "").trim();
			const queueMode = Boolean(running && subagent === null && !empty && !machineBusy);

			react.useEffect(() => {
				if (typeof document === "undefined") return;
				document.documentElement.toggleAttribute("data-dsh-cursor-queue", queueMode);
				return () => {
					document.documentElement.removeAttribute("data-dsh-cursor-queue");
				};
			}, [queueMode]);

			const onQueue = () => {
				if (!inputActions?.submit || empty || machineBusy) return;
				inputActions.submit();
			};

			const onStop = () => {
				const session = sessions?.binding?.(sessionId)?.session;
				if (session?.cancel) {
					session.cancel().catch(() => {});
					return;
				}
			};

			const keepFocus = (e) => {
				e.preventDefault();
			};

			if (!queueMode) return null;

			return jsxs("div", {
				className: "dshUxCursorCtrls",
				"data-dsh-ux-cursor-ctrls": "",
				children: [
					jsx("button", {
						type: "button",
						className: "dshUxCursorStop",
						"data-dsh-ux-ctrl": "stop",
						title: "停止",
						"aria-label": "停止",
						onMouseDown: keepFocus,
						onClick: onStop,
						children: jsx(IconStopSquare, {}),
					}),
					jsx("button", {
						type: "button",
						className: "dshUxCursorQueue",
						"data-dsh-ux-ctrl": "queue",
						title: "加入排队（当前回合结束后发送）",
						"aria-label": "加入排队",
						disabled: machineBusy || !inputActions?.submit,
						onMouseDown: keepFocus,
						onClick: onQueue,
						children: jsx(IconQueueArrow, {}),
					}),
				],
			});
		}

		/**
		 * Cursor-like queue strip above the composer. Replaces shipped QueueDock
		 * (same slot id) so a single item still shows an "N Queued" header.
		 */
		function CursorQueueDock({ useSession, updateQueue, notify, t }) {
			const inbox = useSession ? useSession((s) => s.queue) : [];
			const queue = react.useMemo(
				() => (Array.isArray(inbox) ? inbox.filter((row) => row.placement === "queued") : []),
				[inbox],
			);
			const running = useSession ? useSession((s) => s.running) : false;
			const queueMutable = useSession ? useSession((s) => s.subagent === null) : true;
			const [editing, setEditing] = react.useState(null);
			const [busy, setBusy] = react.useState(null);
			const [collapsed, setCollapsed] = react.useState(false);
			const listId = react.useId();

			react.useEffect(() => {
				if (queue.length === 0 && collapsed) setCollapsed(false);
				if (queue.length > 1 && editing === null && busy === null) {
					/* keep user toggle */
				} else if (queue.length === 1) {
					setCollapsed(false);
				}
				if (editing !== null && (!queueMutable || !queue.some((row) => row.id === editing.id))) {
					setEditing(null);
				}
			}, [queue, queueMutable, editing, busy, collapsed]);

			if (queue.length === 0) return null;

			const interactionActive = queueMutable && (editing !== null || busy !== null);
			const expanded = !collapsed || interactionActive || queue.length === 1;

			const label =
				typeof t === "function"
					? t("queue.count", { n: queue.length })
					: queue.length === 1
						? "1 Queued"
						: `${queue.length} Queued`;

			const applyAction = async (itemId, action, failure) => {
				if (typeof updateQueue !== "function") return false;
				setBusy(itemId);
				try {
					await updateQueue(itemId, action);
					return true;
				} catch (_) {
					notify?.("error", failure || "Queue action failed");
					return false;
				} finally {
					setBusy((current) => (current === itemId ? null : current));
				}
			};

			const saveEdit = async () => {
				if (editing === null || editing.text.trim() === "") return;
				if (
					await applyAction(
						editing.id,
						{ kind: "edit", content: [{ type: "text", text: editing.text }] },
						typeof t === "function" ? t("queue.editFailed") : "Edit failed",
					)
				) {
					setEditing(null);
				}
			};

			return jsx("div", {
				className: "dshUxQDock",
				"data-queue-dock": "",
				"data-dsh-ux-queue": "",
				children: jsxs("div", {
					className: "dshUxQPanel",
					children: [
						jsxs("button", {
							type: "button",
							className: "dshUxQHeader",
							"aria-controls": listId,
							"aria-expanded": expanded,
							disabled: interactionActive,
							onClick: () => setCollapsed((v) => !v),
							children: [
								jsx("span", {
									className: "dshUxQLead",
									"aria-hidden": true,
									children: primitives?.IconQueueOutline14
										? jsx(primitives.IconQueueOutline14, {})
										: jsx("span", { className: "dshUxQDot" }),
								}),
								jsx("span", { className: "dshUxQCount", children: label }),
								jsx("span", {
									className: "dshUxQChevron",
									"aria-hidden": true,
									children: jsx(IconChevron, { up: !expanded }),
								}),
							],
						}),
						jsx("ul", {
							id: listId,
							className: "dshUxQList",
							hidden: !expanded,
							children:
								expanded &&
								queue.map((row) =>
									jsxs(
										"li",
										{
											className: "dshUxQRow",
											children: [
												jsx("span", { className: "dshUxQDot", "aria-hidden": true }),
												editing?.id === row.id
													? jsx("input", {
															autoFocus: true,
															className: "dshUxQEditor",
															"aria-label": typeof t === "function" ? t("queue.edit") : "Edit",
															value: editing.text,
															onChange: (event) => {
																setEditing({ id: row.id, text: event.currentTarget.value });
															},
															onKeyDown: (event) => {
																if (event.key === "Escape") {
																	setEditing(null);
																	return;
																}
																if (event.key === "Enter" && !event.nativeEvent.isComposing) {
																	event.preventDefault();
																	saveEdit();
																}
															},
														})
													: jsx("span", {
															className: "dshUxQPreview",
															children: row.preview || row.text || "",
														}),
												queueMutable
													? jsx("div", {
															className: "dshUxQActions",
															children:
																editing?.id === row.id
																	? jsxs(Fragment, {
																			children: [
																				jsx("button", {
																					type: "button",
																					className: "dshUxQAction",
																					"aria-label": "Save",
																					disabled: busy !== null || editing.text.trim() === "",
																					onClick: saveEdit,
																					children: jsx(IconCheck, {}),
																				}),
																				jsx("button", {
																					type: "button",
																					className: "dshUxQAction",
																					"aria-label": "Cancel",
																					disabled: busy !== null,
																					onClick: () => setEditing(null),
																					children: jsx(IconClose, {}),
																				}),
																			],
																		})
																	: jsxs(Fragment, {
																			children: [
																				jsx("button", {
																					type: "button",
																					className: "dshUxQAction",
																					"aria-label": "Edit",
																					title: row.text === null ? "Unsupported" : "Edit",
																					disabled: busy !== null || row.text === null,
																					onClick: () => {
																						if (row.text !== null) setEditing({ id: row.id, text: row.text });
																					},
																					children: jsx(IconEdit, {}),
																				}),
																				jsx("button", {
																					type: "button",
																					className: "dshUxQAction",
																					"aria-label": "Steer now",
																					title: running ? "Steer into running turn" : "Unavailable while idle",
																					disabled: busy !== null || !running,
																					onClick: () =>
																						applyAction(
																							row.id,
																							{ kind: "steer" },
																							typeof t === "function" ? t("queue.steerFailed") : "Steer failed",
																						),
																					children: jsx(IconSteerSend, {}),
																				}),
																				jsx("button", {
																					type: "button",
																					className: "dshUxQAction",
																					"aria-label": "Remove",
																					disabled: busy !== null,
																					onClick: () =>
																						applyAction(
																							row.id,
																							{ kind: "remove" },
																							typeof t === "function" ? t("queue.removeFailed") : "Remove failed",
																						),
																					children: jsx(IconTrash, {}),
																				}),
																			],
																		}),
														})
													: null,
											],
										},
										row.id,
									),
								),
						}),
					],
				}),
			});
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

			const hint =
				forkSeq === null
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
												className: "dshUxBtn dshUxBtnText",
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
										"aria-label": "复制",
										onClick: onCopy,
										children: jsx(IconCopy, { checked: copied }),
									}),
									jsx("button", {
										type: "button",
										className: "dshUxBtn",
										title: "编辑并分支到新对话",
										"aria-label": "编辑",
										onClick: onStartEdit,
										children: jsx(IconEdit, {}),
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

			const QueueSendView = react.memo(function QueueSendView(props) {
				return jsx(CursorQueueSend, { ...props, __sessions: sessions });
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

			// Cursor-style queue primary (high order → sits just before stock send/stop).
			ctx.slots.inject("conversation.input.right", () =>
				ctx.slots.register(
					{
						name: "conversation.input.right",
						id: "cursor-queue-send",
						order: 999,
						label: "Queue",
					},
					QueueSendView,
				),
			);

			// Replace shipped QueueDock (same id) with Cursor-like strip.
			ctx.slots.inject("conversation.input.dock", () =>
				ctx.slots.register(
					{
						name: "conversation.input.dock",
						id: "queue",
						order: 20,
						priority: -10,
						inject: (sessionId) => {
							const actx = sessions?.scope?.(sessionId);
							const conversation = actx?.get?.("conversation");
							return {
								updateQueue: (itemId, action) => {
									if (!conversation?.updateQueue) {
										return Promise.reject(new Error("queue unavailable"));
									}
									return conversation.updateQueue(itemId, action);
								},
								notify: (level, text) => {
									try {
										conversation?.input?.for?.(actx)?.notify?.(level, text);
									} catch (_) {}
								},
							};
						},
					},
					CursorQueueDock,
				),
			);

			// Suppress Todo/plan dock via empty shadow (CSS is the belt; this is suspenders).
			ctx.slots.inject("conversation.input.dock", () =>
				ctx.slots.register(
					{ name: "conversation.input.dock", id: "todo", order: 0, priority: -10 },
					() => null,
				),
			);
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	},
});
