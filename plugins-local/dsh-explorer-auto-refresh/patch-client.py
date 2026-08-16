#!/usr/bin/env python3
"""Patch dsh-better-sidebar ExplorerView for auto soft-refresh."""
from __future__ import annotations

import sys
from pathlib import Path

MARKER = "dsh-explorer-auto-refresh"

OLD = """\t\t\tconst loadDir = (0, react.useCallback)((dir) => {
\t\t\t\tif (dataRef.current[dir] !== void 0) return;
\t\t\t\tstoreLevel(dir, {});
\t\t\t\tapi.fsTree({
\t\t\t\t\tsessionId,
\t\t\t\t\tcwd
\t\t\t\t}, dir).then((listing) => {
\t\t\t\t\tstoreLevel(dir, { entries: listing.entries });
\t\t\t\t}).catch((error) => {
\t\t\t\t\tstoreLevel(dir, { error: error instanceof Error ? error.message : String(error) });
\t\t\t\t});
\t\t\t}, [
\t\t\t\tsessionId,
\t\t\t\tcwd,
\t\t\t\tstoreLevel
\t\t\t]);
\t\t\t(0, react.useEffect)(() => {
\t\t\t\tconst root = cwd;
\t\t\t\tif (root === void 0) return;
\t\t\t\tloadDir(root);
\t\t\t\tfor (const dir of expanded) loadDir(dir);
\t\t\t}, [
\t\t\t\tcwd,
\t\t\t\texpanded,
\t\t\t\trefreshTick,
\t\t\t\tloadDir
\t\t\t]);"""

NEW = f"""\t\t\t/* {MARKER} */
\t\t\tconst expandedRef = (0, react.useRef)(expanded);
\t\t\texpandedRef.current = expanded;
\t\t\tconst sameEntries = (a, b) => {{
\t\t\t\tif (a.length !== b.length) return false;
\t\t\t\tfor (let i = 0; i < a.length; i++) {{
\t\t\t\t\tconst left = a[i];
\t\t\t\t\tconst right = b[i];
\t\t\t\t\tif (left === void 0 || right === void 0) return false;
\t\t\t\t\tif (left.name !== right.name || left.isDir !== right.isDir || left.path !== right.path) return false;
\t\t\t\t}}
\t\t\t\treturn true;
\t\t\t}};
\t\t\tconst refreshDir = (0, react.useCallback)((dir, soft = false) => {{
\t\t\t\tif (!soft) storeLevel(dir, {{}});
\t\t\t\tapi.fsTree({{
\t\t\t\t\tsessionId,
\t\t\t\t\tcwd
\t\t\t\t}}, dir).then((listing) => {{
\t\t\t\t\tconst prev = dataRef.current[dir];
\t\t\t\t\tif (soft && prev?.entries !== void 0 && sameEntries(prev.entries, listing.entries)) return;
\t\t\t\t\tstoreLevel(dir, {{ entries: listing.entries }});
\t\t\t\t}}).catch((error) => {{
\t\t\t\t\tstoreLevel(dir, {{ error: error instanceof Error ? error.message : String(error) }});
\t\t\t\t}});
\t\t\t}}, [
\t\t\t\tsessionId,
\t\t\t\tcwd,
\t\t\t\tstoreLevel
\t\t\t]);
\t\t\tconst loadDir = (0, react.useCallback)((dir) => {{
\t\t\t\tif (dataRef.current[dir] !== void 0) return;
\t\t\t\trefreshDir(dir, false);
\t\t\t}}, [refreshDir]);
\t\t\t(0, react.useEffect)(() => {{
\t\t\t\tconst root = cwd;
\t\t\t\tif (root === void 0) return;
\t\t\t\tloadDir(root);
\t\t\t\tfor (const dir of expanded) loadDir(dir);
\t\t\t}}, [
\t\t\t\tcwd,
\t\t\t\texpanded,
\t\t\t\trefreshTick,
\t\t\t\tloadDir
\t\t\t]);
\t\t\t(0, react.useEffect)(() => {{
\t\t\t\tif (cwd === void 0) return;
\t\t\t\tconst softRefreshVisible = () => {{
\t\t\t\t\tif (typeof document !== "undefined" && document.visibilityState !== "visible") return;
\t\t\t\t\tconst targets = [cwd, ...expandedRef.current];
\t\t\t\t\tfor (const dir of targets) {{
\t\t\t\t\t\tconst level = dataRef.current[dir];
\t\t\t\t\t\tif (level === void 0) continue;
\t\t\t\t\t\tif (level.entries === void 0 && level.error === void 0) continue;
\t\t\t\t\t\trefreshDir(dir, true);
\t\t\t\t\t}}
\t\t\t\t}};
\t\t\t\tconst onFocus = () => {{
\t\t\t\t\tsoftRefreshVisible();
\t\t\t\t}};
\t\t\t\tconst onVisibility = () => {{
\t\t\t\t\tif (document.visibilityState === "visible") softRefreshVisible();
\t\t\t\t}};
\t\t\t\twindow.addEventListener("focus", onFocus);
\t\t\t\tdocument.addEventListener("visibilitychange", onVisibility);
\t\t\t\tconst timer = window.setInterval(softRefreshVisible, 2e3);
\t\t\t\tsoftRefreshVisible();
\t\t\t\treturn () => {{
\t\t\t\t\twindow.removeEventListener("focus", onFocus);
\t\t\t\t\tdocument.removeEventListener("visibilitychange", onVisibility);
\t\t\t\t\twindow.clearInterval(timer);
\t\t\t\t}};
\t\t\t}}, [
\t\t\t\tcwd,
\t\t\t\tsessionId,
\t\t\t\trefreshDir
\t\t\t]);"""


def patch_file(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if MARKER in text:
        return "ALREADY"
    if OLD not in text:
        return "MISS"
    path.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    return "OK"


def main() -> int:
    paths = [Path(p) for p in sys.argv[1:]]
    if not paths:
        base = Path.home() / ".dsh/profiles/web/node_modules/dsh-better-sidebar/lib"
        paths = [base / "client.js", base / "client-registry.js"]
    status = 0
    for path in paths:
        if not path.exists():
            print(f"{path}=MISSING")
            status = 1
            continue
        result = patch_file(path)
        print(f"{path.name}={result}")
        if result == "MISS":
            status = 1
    return status


if __name__ == "__main__":
    raise SystemExit(main())
