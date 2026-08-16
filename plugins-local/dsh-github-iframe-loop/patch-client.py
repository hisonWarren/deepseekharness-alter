from pathlib import Path
import sys

targets = sys.argv[1:]
if not targets:
    targets = [
        str(Path.home() / ".dsh/profiles/web/node_modules/dsh-better-sidebar/lib/client.js"),
    ]

old = """\t\t\tconst [embedBlocked, setEmbedBlocked] = (0, react.useState)(null);
\t\t\t/** The user asked to load the refused site anyway (keeps the plain iframe). */
\t\t\tconst [forceEmbed, setForceEmbed] = (0, react.useState)(false);
\t\t\t(0, react.useEffect)(() => {
\t\t\t\tif (url === void 0) return;
\t\t\t\tlet cancelled = false;
\t\t\t\tsetEmbedBlocked(null);
\t\t\t\tsetForceEmbed(false);
\t\t\t\tapi.browserProbe(url).then((probe) => {
\t\t\t\t\tif (!cancelled && embeddabilityOf(probe) === \"blocked\") setEmbedBlocked(url);
\t\t\t\t}).catch(() => {});
\t\t\t\treturn () => {
\t\t\t\t\tcancelled = true;
\t\t\t\t};
\t\t\t}, [url]);"""

new = """\t\t\tconst [embedBlocked, setEmbedBlocked] = (0, react.useState)(null);
\t\t\t/** The user asked to load the refused site anyway (keeps the plain iframe). */
\t\t\tconst [forceEmbed, setForceEmbed] = (0, react.useState)(false);
\t\t\tconst [embedReady, setEmbedReady] = (0, react.useState)(false);
\t\t\t(0, react.useEffect)(() => {
\t\t\t\tif (url === void 0) return;
\t\t\t\tlet cancelled = false;
\t\t\t\tsetEmbedBlocked(null);
\t\t\t\tsetForceEmbed(false);
\t\t\t\tsetEmbedReady(false);
\t\t\t\ttry {
\t\t\t\t\tconst host = new URL(url).hostname.toLowerCase();
\t\t\t\t\tif (/(^|\\.)github\\.com$/.test(host) || /(^|\\.)githubusercontent\\.com$/.test(host)) {
\t\t\t\t\t\tsetEmbedBlocked(url);
\t\t\t\t\t\tsetEmbedReady(true);
\t\t\t\t\t\treturn () => {
\t\t\t\t\t\t\tcancelled = true;
\t\t\t\t\t\t};
\t\t\t\t\t}
\t\t\t\t} catch {}
\t\t\t\tapi.browserProbe(url).then((probe) => {
\t\t\t\t\tif (cancelled) return;
\t\t\t\t\tif (embeddabilityOf(probe) === \"blocked\") setEmbedBlocked(url);
\t\t\t\t\tsetEmbedReady(true);
\t\t\t\t}).catch(() => {
\t\t\t\t\tif (!cancelled) setEmbedReady(true);
\t\t\t\t});
\t\t\t\treturn () => {
\t\t\t\t\tcancelled = true;
\t\t\t\t};
\t\t\t}, [url]);"""

old2 = """url === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(\"div\", {
\t\t\t\t\t\tclassName: sidebar_module_css_default.browserStart,
\t\t\t\t\t\tchildren: t(\"browserStart\")
\t\t\t\t\t}) : embedBlocked !== null && !forceEmbed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrowserEmbedBlocked, {"""

new2 = """url === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(\"div\", {
\t\t\t\t\t\tclassName: sidebar_module_css_default.browserStart,
\t\t\t\t\t\tchildren: t(\"browserStart\")
\t\t\t\t\t}) : !embedReady && !forceEmbed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(\"div\", {
\t\t\t\t\t\tclassName: sidebar_module_css_default.browserStart,
\t\t\t\t\t\tchildren: t(\"browserStart\")
\t\t\t\t\t}) : embedBlocked !== null && !forceEmbed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BrowserEmbedBlocked, {"""

for target in targets:
    p = Path(target)
    if not p.exists():
        print(f"MISSING {p}")
        continue
    raw = p.read_text(encoding="utf-8")
    changed = False
    if "embedReady" in raw and "github" in raw and "!embedReady && !forceEmbed" in raw:
        print(f"ALREADY {p.name}")
        continue
    if old in raw:
        raw = raw.replace(old, new, 1)
        changed = True
        print(f"EFFECT_PATCHED {p.name}")
    elif "embedReady" not in raw:
        print(f"EFFECT_MISSING {p.name}")
    if old2 in raw:
        raw = raw.replace(old2, new2, 1)
        changed = True
        print(f"RENDER_PATCHED {p.name}")
    elif "!embedReady && !forceEmbed" not in raw:
        print(f"RENDER_MISSING {p.name}")
    if changed:
        p.write_text(raw, encoding="utf-8")
        print(f"WROTE {p}")
