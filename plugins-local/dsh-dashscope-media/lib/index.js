// dsh-dashscope-media — durable host plugin: Alibaba Cloud Token Plan media tools.
// Runs as a real composition row with full Node access (native fetch + node:fs),
// so no subprocess bridge is needed here. Tool names match the session bridge
// plugin (dshmd-2) so prompts and habits carry over.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';

const MEDIA_HOST = 'https://token-plan.cn-beijing.maas.aliyuncs.com';
const IMG_API = MEDIA_HOST + '/api/v1/services/aigc/multimodal-generation/generation';
const VID_API = MEDIA_HOST + '/api/v1/services/aigc/video-generation/video-synthesis';
const TASK_API = MEDIA_HOST + '/api/v1/tasks/';
const TTS_API = MEDIA_HOST + '/api/v1/services/audio/tts/SpeechSynthesizer';
const OBJ_SCHEMA = { type: 'object', additionalProperties: true };
/** DSH local attachment default is 5MB; leave headroom for JPEG overhead. */
const ATTACH_MAX_BYTES = 4.5 * 1024 * 1024;

function mediaTypeFrom(url, contentType) {
  if (contentType && contentType.indexOf('image/') === 0) return contentType.split(';')[0].trim();
  const u = String(url).toLowerCase();
  if (u.indexOf('.jpg') !== -1 || u.indexOf('.jpeg') !== -1) return 'image/jpeg';
  if (u.indexOf('.webp') !== -1) return 'image/webp';
  if (u.indexOf('.gif') !== -1) return 'image/gif';
  return 'image/png';
}

/** Prefer magic bytes over Content-Type / URL guesses (avoids IMAGE_TYPE_MISMATCH). */
function detectMediaType(buf, fallback) {
  if (!buf || buf.length < 12) return fallback;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    return 'image/webp';
  }
  return fallback;
}

function extFor(mt) {
  return mt === 'image/jpeg' ? '.jpg' : mt === 'image/webp' ? '.webp' : mt === 'image/gif' ? '.gif' : '.png';
}

function basename(p) {
  const s = String(p).replace(/\\/g, '/').split('/');
  return s[s.length - 1];
}

/** Detach a plain JSON snapshot — drops `undefined`, which fails DSH lossless JSON. */
function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function attachmentRef(ref) {
  const out = {
    attachmentId: ref.attachmentId,
    mediaType: ref.mediaType,
    bytes: ref.bytes,
    width: ref.width,
    height: ref.height,
  };
  if (typeof ref.name === 'string' && ref.name.length > 0) out.name = ref.name;
  return out;
}

function loadSharp() {
  try {
    const require = createRequire(import.meta.url);
    return require('sharp');
  } catch (_) {
    try {
      const require = createRequire(import.meta.url);
      const att = require.resolve('@deepseek-ai/dsh-attachment-local/package.json');
      return createRequire(att)('sharp');
    } catch (err) {
      return undefined;
    }
  }
}

/** Shrink large rasters so ctx.attachments.saveImage (5MB default) can admit them. */
async function forAttachment(buf, mediaType) {
  if (buf.byteLength <= ATTACH_MAX_BYTES) return { data: buf, mediaType, compressed: false };
  const sharp = loadSharp();
  if (!sharp) return { data: buf, mediaType, compressed: false, compressError: 'sharp unavailable' };
  try {
    let quality = 82;
    let width = 2048;
    let out = await sharp(buf, { failOn: 'none', limitInputPixels: false })
      .rotate()
      .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    while (out.byteLength > ATTACH_MAX_BYTES && (quality > 45 || width > 1024)) {
      if (quality > 45) quality -= 12;
      else width = Math.max(1024, Math.floor(width * 0.85));
      out = await sharp(buf, { failOn: 'none', limitInputPixels: false })
        .rotate()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }
    return { data: new Uint8Array(out), mediaType: 'image/jpeg', compressed: true, originalBytes: buf.byteLength };
  } catch (err) {
    return { data: buf, mediaType, compressed: false, compressError: String((err && err.message) || err) };
  }
}

async function apiKey(credentials) {
  const r = await credentials.resolve('DASHSCOPE_API_KEY');
  return r && typeof r.value === 'string' ? r.value : undefined;
}

function outDirFor(exec) {
  const header = exec.agent && exec.agent.session ? exec.agent.session.header : undefined;
  const cwd = header && header.cwd ? header.cwd : process.cwd();
  const dir = join(cwd, 'dashscope-media');
  try {
    mkdirSync(dir, { recursive: true });
  } catch (_) {}
  return dir;
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text.slice(0, 2000) };
  }
}

export const name = 'dashscope-media';
export const inject = ['credentials', 'attachments'];

export function apply(ctx) {
  const tools = ctx.get('tools');
  if (tools === undefined) return;

  const imageGen = defineTool({
    name: 'image_gen',
    description:
      '生成图片（阿里云百炼 Token Plan，同步）并在对话中以内联附件显示。默认只用 wan2.7-image + size 1K、n=1；成功后不要换模型重试（会重复计费）。可选 wan2.7-image-pro（4K）、qwen-image-3.0-pro（size 用 宽*高）。可选参考图（0–9）。文件同时写入工作区 dashscope-media/；OSS URL 仅 24 小时有效。',
    parameters: {
      prompt: { type: 'string', required: true, description: '图片描述，中文或英文，≤5000 字符' },
      model: { type: 'string', enum: ['wan2.7-image', 'wan2.7-image-pro', 'qwen-image-3.0-pro'], description: '默认 wan2.7-image（最省配额）' },
      size: { type: 'string', description: "wan 模型：'1K' | '2K' | '4K'（4K 仅 -pro 文生图）；qwen-image：'宽*高'（如 1024*1024，512–2048）" },
      n: { type: 'integer', description: '生成张数 1–4，默认 1（成本=单价×张数）' },
      reference_images: { type: 'array', items: { type: 'string' }, description: '参考图列表（图生图/编辑），每张为 http(s) URL 或 data:image/...;base64' },
      seed: { type: 'integer', description: '随机种子 0–2147483647' },
      watermark: { type: 'boolean', description: '右下角加 AI Generated 水印，默认 false' },
      thinking_mode: { type: 'boolean', description: '思考模式，默认 true（质量更好、更慢）' },
    },
    output: {
      schema: OBJ_SCHEMA,
      render(_args, value) {
        const blocks = [];
        const images = (value && value.images) || [];
        for (const img of images) {
          if (img && img.attachment) blocks.push({ type: 'image', attachment: img.attachment });
        }
        const okCount = images.filter((img) => img && img.ok && img.attachment).length;
        const fileCount = images.filter((img) => img && img.ok && img.file).length;
        if (value && value.ok) {
          let text;
          if (okCount > 0) {
            text = '已生成 ' + okCount + ' 张图片（' + (value.model || 'image_gen') + '），已在对话中显示。';
          } else if (fileCount > 0) {
            const notes = images.map((img) => img && img.attachmentNote).filter(Boolean).join('; ');
            text = '已保存 ' + fileCount + ' 张到工作区；会话附件登记失败（' + (notes || 'unknown') + '）。下方若仍无图，请打开 dashscope-media/。';
          } else {
            text = '图片请求成功，但未能登记会话附件：' + (value.note || '见 images[].attachmentNote');
          }
          blocks.push({ type: 'text', text });
          // Client toolview may fall back to /sidebar/file when attachment is missing.
          blocks.push({
            type: 'text',
            text: '__dsh_media__' + JSON.stringify({
              images: images.map((img) => ({
                ok: !!(img && img.ok),
                file: img && img.file,
                attachment: img && img.attachment,
                attachmentNote: img && img.attachmentNote,
              })),
            }),
          });
        } else {
          blocks.push({ type: 'text', text: JSON.stringify(value, null, 2) });
        }
        return blocks;
      },
    },
    timeoutMs: 300000,
    async execute(args, exec) {
      const key = await apiKey(ctx.credentials);
      if (!key) return jsonSafe({ ok: false, error: 'MISSING_CREDENTIAL', message: 'DASHSCOPE_API_KEY 未配置（应位于 %USERPROFILE%\\.dsh\\.credentials.yaml）' });
      const model = args.model || 'wan2.7-image';
      const content = [];
      for (const ref of args.reference_images || []) content.push({ image: ref });
      content.push({ text: args.prompt });
      const parameters = {};
      if (args.size) parameters.size = args.size;
      if (args.n) parameters.n = args.n;
      if (args.seed !== undefined && args.seed !== null) parameters.seed = args.seed;
      if (args.watermark !== undefined) parameters.watermark = !!args.watermark;
      if (args.thinking_mode !== undefined) parameters.thinking_mode = !!args.thinking_mode;
      let res;
      try {
        res = await fetch(IMG_API, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, input: { messages: [{ role: 'user', content }] }, parameters }),
          signal: exec.signal,
        });
      } catch (err) {
        return jsonSafe({ ok: false, error: 'TRANSPORT', message: String((err && err.message) || err) });
      }
      const body = await readJson(res);
      if (!res.ok) {
        return jsonSafe({ ok: false, error: 'HTTP_' + res.status, httpStatus: res.status, code: body.code, message: body.message, request_id: body.request_id, note: '图像生成失败（未产生计费张数）。检查参数后重试；连续失败请核对控制台配额。' });
      }
      const choices = (body.output && body.output.choices) || [];
      const urls = [];
      for (const c of choices) {
        for (const part of (c.message && c.message.content) || []) {
          if (part && typeof part.image === 'string') urls.push(part.image);
        }
      }
      if (urls.length === 0) return jsonSafe({ ok: false, error: 'NO_IMAGE_URL', message: '响应中没有图片 URL', request_id: body.request_id });
      const outDir = outDirFor(exec);
      const images = [];
      for (let i = 0; i < urls.length; i++) {
        try {
          const r = await fetch(urls[i], { signal: exec.signal });
          if (!r.ok) {
            images.push({ index: i, ok: false, url: urls[i], note: '下载失败 HTTP ' + r.status });
            continue;
          }
          const raw = new Uint8Array(await r.arrayBuffer());
          const guessed = mediaTypeFrom(urls[i], r.headers.get('content-type'));
          const mt = detectMediaType(raw, guessed);
          const file = join(outDir, 'gen-' + Date.now() + '-' + i + extFor(mt));
          writeFileSync(file, raw);
          const row = { index: i, ok: true, url: urls[i], file, mediaType: mt, bytes: raw.length };
          try {
            const prepared = await forAttachment(raw, mt);
            if (prepared.compressError) row.compressNote = prepared.compressError;
            if (prepared.compressed) {
              row.attachmentBytes = prepared.data.byteLength;
              row.compressed = true;
            }
            const attachName =
              prepared.mediaType === 'image/jpeg'
                ? basename(file).replace(/\.[^.]+$/, '.jpg')
                : basename(file);
            const ref = await ctx.attachments.saveImage({
              data: prepared.data,
              mediaType: prepared.mediaType,
              name: attachName,
            });
            row.attachment = attachmentRef(ref);
          } catch (err) {
            const msg = String((err && err.message) || err);
            const code = err && err.code ? String(err.code) : undefined;
            row.attachmentNote = code ? code + ': ' + msg : msg;
          }
          images.push(row);
        } catch (err) {
          images.push({ index: i, ok: false, url: urls[i], note: String((err && err.message) || err) });
        }
      }
      return jsonSafe({
        ok: true,
        model,
        request_id: body.request_id,
        usage: body.usage,
        outDir,
        url_expires_in_hours: 24,
        note: '图片已保存；优先作为会话附件内联显示。成功后勿换模型重试。OSS URL 24 小时后过期。',
        images,
      });
    },
  });

  const videoGen = defineTool({
    name: 'video_gen',
    description:
      '提交视频生成任务（阿里云百炼 Token Plan，异步）。模型：happyhorse-1.1-t2v（文生视频，prompt 即可）、happyhorse-1.1-i2v（图生视频，首帧 image_urls[0]）、happyhorse-1.1-r2v（参考图生视频，image_urls 1–9 张，prompt 中用 [Image 1]…[Image N] 引用）。提交成功返回 task_id，任务不会自动重提（避免重复计费）；用 video_status 查询进度。resolution 默认 720P，duration 默认 5 秒（范围 3–15）。视频按次计费，是套餐里最贵的操作，谨慎使用。',
    parameters: {
      mode: { type: 'string', enum: ['t2v', 'i2v', 'r2v'], required: true, description: '视频生成方式' },
      prompt: { type: 'string', required: true, description: '视频描述（r2v 时用 [Image 1] 等占位符引用参考图）' },
      resolution: { type: 'string', enum: ['480P', '720P', '1080P'], description: '默认 720P' },
      ratio: { type: 'string', enum: ['16:9', '9:16', '1:1', '4:3', '3:4', '4:5', '5:4', '9:21', '21:9'], description: '画面比例（i2v 不适用，跟随首帧），默认 16:9' },
      duration: { type: 'integer', description: '时长秒数 3–15，默认 5' },
      image_urls: { type: 'array', items: { type: 'string' }, description: 'i2v：1 张首帧图；r2v：1–9 张参考图。http(s) URL 或 base64 data URI' },
    },
    output: { schema: OBJ_SCHEMA, render(_args, value) { return [{ type: 'text', text: JSON.stringify(value, null, 2) }]; } },
    timeoutMs: 60000,
    async execute(args, exec) {
      const key = await apiKey(ctx.credentials);
      if (!key) return { ok: false, error: 'MISSING_CREDENTIAL', message: 'DASHSCOPE_API_KEY 未配置' };
      const model = 'happyhorse-1.1-' + args.mode;
      const input = { prompt: args.prompt };
      if (args.mode === 'i2v' || args.mode === 'r2v') {
        const urls = args.image_urls || [];
        if (urls.length === 0) return { ok: false, error: 'MISSING_IMAGE', message: args.mode + ' 需要 image_urls（i2v 1 张首帧 / r2v 1–9 张参考图）' };
        input.media = urls.map((u) => ({ type: args.mode === 'i2v' ? 'first_frame' : 'reference_image', url: u }));
      }
      const parameters = { resolution: args.resolution || '720P', duration: args.duration || 5 };
      if (args.mode !== 'i2v' && args.ratio) parameters.ratio = args.ratio;
      let res;
      try {
        res = await fetch(VID_API, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' },
          body: JSON.stringify({ model, input, parameters }),
          signal: exec.signal,
        });
      } catch (err) {
        return { ok: false, error: 'TRANSPORT', message: String((err && err.message) || err) };
      }
      const body = await readJson(res);
      if (!res.ok || !(body.output && body.output.task_id)) {
        return { ok: false, submitted: false, error: 'HTTP_' + res.status, code: body.code, message: body.message, request_id: body.request_id, note: '任务未创建，未计费。请勿盲目重试——先核对参数或控制台配额，再用 video_status 查旧任务。' };
      }
      return { ok: true, submitted: true, mode: args.mode, task_id: body.output.task_id, task_status: body.output.task_status, request_id: body.request_id, note: '任务已提交（计费随任务完成结算）。task_id 24 小时内有效；用 video_status 查询，勿重复提交同一任务。' };
    },
  });

  const videoStatus = defineTool({
    name: 'video_status',
    description:
      '查询视频生成任务状态（不产生新计费）。轮询最多约 2 分钟；SUCCEEDED 时返回 video_url（24 小时内有效，请立即告诉用户打开/保存）。FAILED/CANCELED/UNKNOWN 时返回原因，不要自动重新提交任务。',
    parameters: {
      task_id: { type: 'string', required: true, description: 'video_gen 返回的 task_id' },
      max_polls: { type: 'integer', description: '最大轮询次数 1–8，默认 6（每次间隔约 20 秒）' },
    },
    output: { schema: OBJ_SCHEMA, render(_args, value) { return [{ type: 'text', text: JSON.stringify(value, null, 2) }]; } },
    timeoutMs: 260000,
    async execute(args, exec) {
      const key = await apiKey(ctx.credentials);
      if (!key) return { ok: false, error: 'MISSING_CREDENTIAL', message: 'DASHSCOPE_API_KEY 未配置' };
      const polls = Math.max(1, Math.min(8, args.max_polls || 6));
      let last = null;
      for (let i = 0; i < polls; i++) {
        let res;
        try {
          res = await fetch(TASK_API + encodeURIComponent(args.task_id), { headers: { Authorization: 'Bearer ' + key }, signal: exec.signal });
        } catch (err) {
          return { ok: false, error: 'TRANSPORT', message: String((err && err.message) || err), polls: i + 1 };
        }
        const body = await readJson(res);
        const out = body.output || {};
        last = {
          ok: res.ok,
          httpStatus: res.status,
          task_id: out.task_id,
          task_status: out.task_status,
          code: out.code,
          message: out.message,
          video_url: out.video_url,
          usage: out.usage,
          submit_time: out.submit_time,
          end_time: out.end_time,
          request_id: body.request_id,
        };
        if (!res.ok) return Object.assign({ ok: false, error: 'HTTP_' + res.status, polls: i + 1 }, last);
        if (out.task_status === 'SUCCEEDED') {
          return Object.assign({ ok: true, done: true, polls: i + 1, note: '任务成功。video_url 24 小时内有效，请立即告知用户打开或保存；视频已计费。' }, last);
        }
        if (out.task_status === 'FAILED' || out.task_status === 'CANCELED' || out.task_status === 'UNKNOWN') {
          return Object.assign({ ok: false, done: true, polls: i + 1, note: '任务已终态失败/取消/未知。不要自动重新提交——先核对参数与配额，或询问用户。' }, last);
        }
        if (i < polls - 1) {
          try {
            await new Promise((resolve, reject) => {
              const t = setTimeout(resolve, 20000);
              exec.signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('ABORTED')); }, { once: true });
            });
          } catch (_) {
            return { ok: false, error: 'ABORTED', polls: i + 1 };
          }
        }
      }
      return Object.assign({ ok: true, done: false, polls, note: '仍在处理中。稍后可用同一 task_id 再次调用 video_status 继续查询。' }, last);
    },
  });

  const tts = defineTool({
    name: 'tts',
    description:
      '语音合成（阿里云百炼 Token Plan，qwen-audio-3.0-tts-plus，同步）。把文本合成语音，mp3 文件保存到工作区 dashscope-media/ 目录。voice 默认 longanhuan_v3.6（甜美女声）；format 支持 mp3（默认）与 wav。计费按字符数（返回 usage.characters）。',
    parameters: {
      text: { type: 'string', required: true, description: '要合成的文本（中文/英文）' },
      voice: { type: 'string', description: '音色，默认 longanhuan_v3.6' },
      format: { type: 'string', enum: ['mp3', 'wav'], description: '音频格式，默认 mp3' },
    },
    output: { schema: OBJ_SCHEMA, render(_args, value) { return [{ type: 'text', text: JSON.stringify(value, null, 2) }]; } },
    timeoutMs: 120000,
    async execute(args, exec) {
      const key = await apiKey(ctx.credentials);
      if (!key) return { ok: false, error: 'MISSING_CREDENTIAL', message: 'DASHSCOPE_API_KEY 未配置' };
      let res;
      try {
        res = await fetch(TTS_API, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen-audio-3.0-tts-plus',
            input: { text: args.text, voice: args.voice || 'longanhuan_v3.6', format: args.format || 'mp3', sample_rate: 24000 },
          }),
          signal: exec.signal,
        });
      } catch (err) {
        return { ok: false, error: 'TRANSPORT', message: String((err && err.message) || err) };
      }
      const body = await readJson(res);
      if (!res.ok) return { ok: false, error: 'HTTP_' + res.status, code: body.code, message: body.message, request_id: body.request_id };
      const audio = body.output && body.output.audio;
      if (!audio || !audio.url) return { ok: false, error: 'NO_AUDIO_URL', message: '响应中没有音频 URL', request_id: body.request_id };
      const outDir = outDirFor(exec);
      const ext = (args.format || 'mp3') === 'wav' ? '.wav' : '.mp3';
      const file = join(outDir, 'tts-' + Date.now() + ext);
      try {
        const r = await fetch(audio.url, { signal: exec.signal });
        if (!r.ok) return { ok: false, error: 'DOWNLOAD', message: '音频下载失败 HTTP ' + r.status, url: audio.url };
        const buf = new Uint8Array(await r.arrayBuffer());
        writeFileSync(file, buf);
        return { ok: true, file, bytes: buf.length, url: audio.url, url_expires_in_hours: 24, usage: body.usage, request_id: body.request_id, note: '音频已保存到 ' + file + '；原始 OSS URL 24 小时后过期。' };
      } catch (err) {
        return { ok: false, error: 'DOWNLOAD', message: String((err && err.message) || err), url: audio.url };
      }
    },
  });

  const d1 = tools.register(imageGen);
  const d2 = tools.register(videoGen);
  const d3 = tools.register(videoStatus);
  const d4 = tools.register(tts);
  return () => {
    if (typeof d1 === 'function') d1();
    if (typeof d2 === 'function') d2();
    if (typeof d3 === 'function') d3();
    if (typeof d4 === 'function') d4();
  };
}
