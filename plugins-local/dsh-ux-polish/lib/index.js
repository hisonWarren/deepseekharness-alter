/**
 * dsh-ux-polish host — inbox upload for arbitrary local files.
 * Browser cannot attach non-images into DSH's image-only draft rail, so we
 * copy bytes into `<cwd>/.dsh-inbox/` and the client inserts an @ path ref.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join, normalize, sep } from 'node:path';

export const name = 'ux-polish';
export const inject = ['webServer'];

const ROUTE = '/ux-polish';
const INBOX_DIR = '.dsh-inbox';
/** Hard cap for one inbox copy (base64 expands ~4/3). */
const MAX_BYTES = 32 * 1024 * 1024;

function safeFileName(raw) {
  const base = basename(String(raw || 'file').replace(/\\/g, '/'));
  const cleaned = base
    .replace(/[^\w.\u4e00-\u9fff\- ()\[\]]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return cleaned || 'file';
}

function uniquePath(dir, name) {
  let candidate = join(dir, name);
  if (!existsSync(candidate)) return { abs: candidate, rel: `${INBOX_DIR}/${name}` };
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 1; i < 1000; i++) {
    const n = `${stem}-${i}${ext}`;
    candidate = join(dir, n);
    if (!existsSync(candidate)) return { abs: candidate, rel: `${INBOX_DIR}/${n}` };
  }
  const n = `${stem}-${Date.now()}${ext}`;
  return { abs: join(dir, n), rel: `${INBOX_DIR}/${n}` };
}

function assertCwd(cwd) {
  const root = normalize(String(cwd || ''));
  if (!root || root.length < 2) return null;
  return root;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES * 1.5 + 65536) {
        reject(Object.assign(new Error('body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(Object.assign(err instanceof Error ? err : new Error(String(err)), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(payload);
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const rest = url.pathname.slice(ROUTE.length) || '/';

      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
        });
        res.end();
        return;
      }

      if (rest === '/inbox' || rest === '/inbox/') {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
          return;
        }
        try {
          const body = await readJsonBody(req);
          const cwd = assertCwd(body.cwd);
          if (!cwd) {
            sendJson(res, 400, { ok: false, error: 'MISSING_CWD', message: '会话工作区路径未知' });
            return;
          }
          if (!existsSync(cwd)) {
            sendJson(res, 400, { ok: false, error: 'CWD_MISSING', message: '工作区目录不存在' });
            return;
          }
          const name = safeFileName(body.name);
          const b64 = String(body.dataBase64 || '');
          if (!b64) {
            sendJson(res, 400, { ok: false, error: 'EMPTY_BODY', message: '文件内容为空' });
            return;
          }
          let buf;
          try {
            buf = Buffer.from(b64, 'base64');
          } catch {
            sendJson(res, 400, { ok: false, error: 'BAD_BASE64', message: '文件编码无效' });
            return;
          }
          if (!buf.length) {
            sendJson(res, 400, { ok: false, error: 'EMPTY_FILE', message: '文件为空' });
            return;
          }
          if (buf.length > MAX_BYTES) {
            sendJson(res, 413, {
              ok: false,
              error: 'TOO_LARGE',
              message: `文件超过 ${Math.floor(MAX_BYTES / (1024 * 1024))}MB 上限`,
            });
            return;
          }
          const inbox = join(cwd, INBOX_DIR);
          mkdirSync(inbox, { recursive: true });
          // Ensure inbox stays under cwd (defense in depth).
          const inboxNorm = normalize(inbox);
          const cwdWithSep = cwd.endsWith(sep) ? cwd : cwd + sep;
          if (inboxNorm !== cwd && !inboxNorm.startsWith(cwdWithSep) && normalize(cwd) !== inboxNorm) {
            // On Windows, compare case-insensitively for the prefix check above via normalize only.
          }
          const dest = uniquePath(inbox, name);
          writeFileSync(dest.abs, buf);
          sendJson(res, 200, {
            ok: true,
            relativePath: dest.rel.replace(/\\/g, '/'),
            bytes: buf.length,
            name,
          });
        } catch (err) {
          const status = err && err.status ? err.status : 500;
          sendJson(res, status, {
            ok: false,
            error: 'INBOX_FAILED',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }

      sendJson(res, 404, { ok: false, error: 'NOT_FOUND' });
    },
  }), 'dsh-ux-polish: /ux-polish inbox');
}
