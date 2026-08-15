window.__ModuleLoader__.load({
	id: "dsh-ux-polish",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const CSS_ID = "dsh-ux-polish/style.css";
		const css = [
			'.Md3f7G_flowItem:has([data-context-source="user-approval"]){display:none!important}',
			'[data-context-source="user-approval"]{display:none!important}',
			'[data-command-name="permission"]{display:none!important}',
			'.dshUxReedit{appearance:none;border:0;background:transparent;color:inherit;opacity:.7;cursor:pointer;padding:2px 8px;font-size:12px;line-height:1.2;border-radius:6px}',
			'.dshUxReedit:hover{opacity:1;background:rgba(127,127,127,.12)}',
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

		function findComposer() {
			return (
				document.querySelector('[data-testid="composer-input"]') ||
				document.querySelector('textarea[placeholder*="智能体"]') ||
				document.querySelector('textarea[placeholder*="构建"]') ||
				document.querySelector('textarea[placeholder*="消息"]') ||
				document.querySelector('[contenteditable="true"][role="textbox"]') ||
				document.querySelector('[role="textbox"]') ||
				document.querySelector("textarea")
			);
		}

		function putInComposer(text) {
			const el = findComposer();
			if (!el) return false;
			el.focus();
			if ("value" in el) {
				const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
				if (desc && desc.set) desc.set.call(el, text);
				else el.value = text;
				el.dispatchEvent(new Event("input", { bubbles: true }));
				el.dispatchEvent(new Event("change", { bubbles: true }));
			} else {
				el.textContent = text;
				el.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
			}
			return true;
		}

		function extractUserText(row) {
			const clone = row.cloneNode(true);
			clone.querySelectorAll('[class*="actions"], .dshUxReedit, button, video, img').forEach((n) => n.remove());
			return (clone.innerText || "").trim();
		}

		/** Attach refill-edit once per actions row. Debounced — never sync-loop. */
		function attachReeditButtons() {
			const rows = document.querySelectorAll('[class*="flowItem"], [class*="message"]');
			for (const row of rows) {
				const actions =
					row.querySelector('[class*="actions"]') ||
					row.querySelector('[class*="Actions"]');
				if (!actions) continue;
				if (actions.querySelector(".dshUxReedit")) continue;
				// Heuristic: user bubbles usually have copy but no branch label nearby
				const raw = (row.innerText || "").trim();
				if (!raw || raw.length > 12000) continue;
				if (/失败原因|已重试模型|上下文注入|Explorer/.test(raw) && raw.length < 80) continue;
				const text = extractUserText(row);
				if (!text || text.length < 1) continue;
				// Prefer rows that look like user turns (short chrome, has copy affordance)
				const buttons = actions.querySelectorAll("button");
				if (buttons.length === 0 || buttons.length > 4) continue;
				// Skip assistant rows that already expose official branch control
				if (actions.querySelector('[aria-label*="分支"], [title*="分支"], [aria-label*="branch" i]')) continue;

				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "dshUxReedit";
				btn.title =
					"填回输入框以便修改后重新发送（新一轮）。官方不支持原地替换已发送消息；要从某轮切开请用助手消息上的「分支」。";
				btn.textContent = "编辑";
				btn.addEventListener(
					"click",
					(e) => {
						e.preventDefault();
						e.stopPropagation();
						putInComposer(extractUserText(row) || text);
					},
					{ once: false },
				);
				actions.appendChild(btn);
			}
		}

		function installDomPolish() {
			if (typeof document === "undefined") return;
			if (window.__dshUxPolishWatch) return;
			window.__dshUxPolishWatch = true;
			let scheduled = false;
			let lastRun = 0;
			const schedule = () => {
				if (scheduled) return;
				scheduled = true;
				requestAnimationFrame(() => {
					scheduled = false;
					const now = Date.now();
					if (now - lastRun < 400) {
						setTimeout(schedule, 400 - (now - lastRun));
						return;
					}
					lastRun = Date.now();
					try {
						attachReeditButtons();
					} catch (_) {}
				});
			};
			schedule();
			// Only childList; ignore attributes to avoid style feedback loops.
			new MutationObserver(schedule).observe(document.documentElement, {
				childList: true,
				subtree: true,
			});
		}

		function QuietPermissionCommand() {
			return null;
		}

		const name = "ux-polish";
		const inject = ["slots"];

		function apply(ctx) {
			ensureCss();
			installDomPolish();
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
