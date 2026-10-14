'use strict';

// Distribution-only publisher. It reconstructs an already-built executable;
// it contains no Xispa application sources, private signing key or credentials.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { TextDecoder } = require('node:util');

const REPOSITORY = 'XispasStudios/XispasInstaller';
const VERSION = '0.3.17';
const TAG = 'v' + VERSION;
const BASE_VERSION = '0.3.10';
const BASE_EXE = 'Xispa-Suite-0.3.10-Windows.exe';
const TARGET_EXE = 'Xispa-Suite-' + VERSION + '-Windows.exe';
const BASE_URL = 'https://github.com/' + REPOSITORY + '/releases/download/v0.3.10/Publicar-Xispa-0.3.10.zip';
const BASE_ZIP_SHA256 = 'a1df301d406e34eff41139f6d6fd7d9fa143fde1be08d0bd1b6b0cbb28c8c3da';
const BASE_EXE_SHA256 = 'f7540e64b97d82c4c8df96a895d8963ccf1478af574313f6427c5a85bb92376b';
const TARGET_URL = 'https://github.com/' + REPOSITORY + '/releases/download/' + TAG + '/' + TARGET_EXE;
const PUBLIC_KEY_DER = 'MCowBQYDK2VwAyEAl1O/s3M//VjVo7hYkth9Op7B3Q1CVOrDiTbpbEju7mI=';
const API_PREFIX = '/repos/' + REPOSITORY;
const MAX_BINARY = 1024 * 1024 * 1024;
const MAX_DELTA = 64 * 1024 * 1024;
const MAX_MANIFEST = 512 * 1024;
const DOWNLOAD_HOSTS = new Set(['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com', 'github-releases.githubusercontent.com']);
const HASH = /^[a-f0-9]{64}$/;
let token = '';

function fail(message) { throw new Error(message); }
function record(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function integer(value, minimum, maximum) { return Number.isSafeInteger(value) && value >= minimum && value <= maximum; }
function fields(value, allowed, label) {
  if (!record(value) || Object.keys(value).some(key => !allowed.includes(key))) fail('Invalid ' + label + ' fields.');
}
function bytesBase64(value, maximum, label) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximum || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) fail('Invalid ' + label + ' encoding.');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) fail('Noncanonical ' + label + ' encoding.');
  return bytes;
}
function readLimited(file, maximum) {
  const info = fs.lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maximum) fail('Invalid distribution input file.');
  return fs.readFileSync(file);
}
function jsonBytes(bytes, label) {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { fail('Invalid ' + label + ' JSON.'); }
}
async function digest(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function validateInputs(directory) {
  const manifestBytes = readLimited(path.join(directory, 'updates.json'), MAX_MANIFEST);
  const envelope = jsonBytes(manifestBytes, 'signed manifest');
  fields(envelope, ['payload', 'signature'], 'signed manifest');
  const payload = bytesBase64(envelope.payload, MAX_MANIFEST, 'manifest payload');
  const signature = bytesBase64(envelope.signature, 88, 'manifest signature');
  const publicKey = crypto.createPublicKey({ key: Buffer.from(PUBLIC_KEY_DER, 'base64'), format: 'der', type: 'spki' });
  if (signature.length !== 64 || !crypto.verify(null, payload, publicKey, signature)) fail('The release manifest is not signed by the pinned Xispa key.');
  const catalog = jsonBytes(payload, 'verified manifest');
  if (!record(catalog) || catalog.schema !== 1 || catalog.channel !== 'stable' || !Array.isArray(catalog.releases) || catalog.releases.length !== 1) fail('Expected exactly one signed stable release.');
  const release = catalog.releases[0];
  if (!record(release) || release.id !== 'suite' || release.version !== VERSION || release.platform !== 'win32' || release.arch !== 'x64' || release.url !== TARGET_URL || !integer(release.size, 4096, MAX_BINARY) || !HASH.test(release.sha256)) fail('Signed release version, platform, URL, hash or size does not match this publisher.');
  if (!record(release.notes) || ['es', 'en'].some(language => typeof release.notes[language] !== 'string' || release.notes[language].length > 12000)) fail('Invalid signed release notes.');
  const delta = jsonBytes(readLimited(path.join(directory, 'binary-delta.json'), MAX_DELTA), 'binary delta');
  fields(delta, ['schema', 'baseVersion', 'version', 'baseSize', 'baseSha256', 'size', 'sha256', 'operations'], 'binary delta');
  if (delta.schema !== 1 || delta.baseVersion !== BASE_VERSION || delta.version !== VERSION || delta.baseSha256 !== BASE_EXE_SHA256 || !integer(delta.baseSize, 4096, MAX_BINARY) || delta.size !== release.size || delta.sha256 !== release.sha256 || !Array.isArray(delta.operations) || delta.operations.length === 0 || delta.operations.length > 200000) fail('Delta does not describe the pinned base and signed target.');
  let total = 0;
  for (const operation of delta.operations) {
    if (!record(operation)) fail('Invalid delta operation.');
    if (Object.hasOwn(operation, 'copy')) {
      fields(operation, ['copy', 'length'], 'copy operation');
      if (!integer(operation.copy, 0, delta.baseSize) || !integer(operation.length, 1, delta.baseSize) || operation.copy + operation.length > delta.baseSize) fail('Delta copy exceeds the pinned base.');
      total += operation.length;
    } else {
      fields(operation, ['data'], 'literal operation');
      total += bytesBase64(operation.data, MAX_DELTA, 'delta literal').length;
    }
    if (!Number.isSafeInteger(total) || total > release.size) fail('Delta output exceeds signed size.');
  }
  if (total !== release.size) fail('Delta output length differs from signed size.');
  return { delta, release, manifestBytes, manifestHash: crypto.createHash('sha256').update(manifestBytes).digest('hex') };
}

function publicURL(value) {
  let url; try { url = new URL(value); } catch { fail('Invalid public binary download URL.'); }
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || !DOWNLOAD_HOSTS.has(url.hostname)) fail('Public binary download left the allowed GitHub hosts.');
  return url;
}
async function downloadBase(destination) {
  const deadline = Date.now() + 10 * 60 * 1000;
  async function transfer(value, redirects = 0) {
    if (redirects > 5 || Date.now() >= deadline) fail('Public binary download redirect or time limit exceeded.');
    const url = publicURL(value);
    return new Promise((resolve, reject) => {
      let complete = false, output, bytes = 0;
      const hash = crypto.createHash('sha256');
      const finish = (error, result) => { if (complete) return; complete = true; clearTimeout(timer); error ? reject(error) : resolve(result); };
      const request = https.get(url, { headers: { 'User-Agent': 'Xispa-Binary-Publisher/1', Accept: 'application/octet-stream', 'Accept-Encoding': 'identity' }, timeout: 30000 }, response => {
        const status = response.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = response.headers.location; response.resume();
          if (!location) return finish(new Error('Missing GitHub download redirect.'));
          let next; try { next = publicURL(new URL(location, url).href); } catch (error) { return finish(error); }
          finish(null, { next: next.href }); return;
        }
        if (status !== 200 || response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') { response.resume(); return finish(new Error('Public base download failed with HTTP ' + status + '.')); }
        const length = response.headers['content-length'];
        if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BINARY)) { response.destroy(); return finish(new Error('Base ZIP exceeds the size limit.')); }
        output = fs.createWriteStream(destination, { flags: 'wx', mode: 0o600 });
        output.on('error', () => { request.destroy(); finish(new Error('Could not save the public base ZIP.')); });
        response.on('error', () => { output.destroy(); finish(new Error('Public base ZIP transfer was interrupted.')); });
        response.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > MAX_BINARY) { response.destroy(); output.destroy(); return finish(new Error('Base ZIP exceeds the size limit.')); }
          hash.update(chunk);
        });
        response.pipe(output);
        output.on('finish', () => finish(null, { bytes, sha256: hash.digest('hex') }));
      });
      const timer = setTimeout(() => { request.destroy(); output?.destroy(); finish(new Error('Public base download timed out.')); }, Math.max(1, deadline - Date.now()));
      request.on('timeout', () => { request.destroy(); output?.destroy(); finish(new Error('Public base download stalled.')); });
      request.on('error', () => { output?.destroy(); finish(new Error('Public base download failed.')); });
    }).then(result => result.next ? transfer(result.next, redirects + 1) : result);
  }
  const result = await transfer(BASE_URL);
  if (result.sha256 !== BASE_ZIP_SHA256) fail('Public base ZIP does not match its pinned SHA-256.');
}

function extractBase(zip, output, expectedSize) {
  // Never extract all entries or derive an output path from an archive member.
  const program = String.raw`import hashlib,json,sys,zipfile
archive,destination,name,size=sys.argv[1:]
size=int(size)
with zipfile.ZipFile(archive,'r') as z:
 entries=z.infolist()
 if len(entries)>64: raise ValueError('Too many ZIP entries')
 matches=[i for i in entries if i.filename==name]
 if len(matches)!=1: raise ValueError('Missing or duplicate base executable')
 item=matches[0]
 if item.is_dir() or item.flag_bits&1 or item.compress_type not in (0,8) or item.file_size!=size: raise ValueError('Invalid base ZIP entry')
 digest=hashlib.sha256();count=0
 with z.open(item,'r') as source,open(destination,'xb') as target:
  while True:
   block=source.read(1048576)
   if not block: break
   count+=len(block)
   if count>size: raise ValueError('Base exceeds expected size')
   target.write(block);digest.update(block)
 if count!=size: raise ValueError('Truncated base executable')
 print(json.dumps({'size':count,'sha256':digest.hexdigest()}))
`;
  const process = spawnSync('python3', ['-c', program, zip, output, BASE_EXE, String(expectedSize)], { encoding: 'utf8', timeout: 300000, maxBuffer: 65536, windowsHide: true });
  if (process.error || process.status !== 0) fail('Could not read the pinned executable from its ZIP.');
  const result = jsonBytes(Buffer.from(process.stdout), 'base ZIP metadata');
  if (result.size !== expectedSize || result.sha256 !== BASE_EXE_SHA256) fail('Extracted base executable does not match its pinned hash and size.');
}
function writeAll(descriptor, buffer) {
  let offset = 0;
  while (offset < buffer.length) { const written = fs.writeSync(descriptor, buffer, offset, buffer.length - offset); if (written <= 0) fail('Could not complete executable output.'); offset += written; }
}
function reconstruct(base, output, delta) {
  const source = fs.openSync(base, 'r'), target = fs.openSync(output, 'wx', 0o600);
  const buffer = Buffer.alloc(1024 * 1024), hash = crypto.createHash('sha256');
  let total = 0;
  try {
    for (const operation of delta.operations) {
      if (Object.hasOwn(operation, 'copy')) {
        let remaining = operation.length, position = operation.copy;
        while (remaining) {
          const count = fs.readSync(source, buffer, 0, Math.min(buffer.length, remaining), position);
          if (count <= 0) fail('Pinned base executable was truncated.');
          const chunk = buffer.subarray(0, count); writeAll(target, chunk); hash.update(chunk);
          total += count; remaining -= count; position += count;
        }
      } else {
        const chunk = bytesBase64(operation.data, MAX_DELTA, 'delta literal');
        writeAll(target, chunk); hash.update(chunk); total += chunk.length;
      }
    }
    fs.fsyncSync(target);
  } finally { fs.closeSync(source); fs.closeSync(target); }
  if (total !== delta.size || hash.digest('hex') !== delta.sha256 || fs.statSync(output).size !== delta.size) fail('Reconstructed executable differs from the signed target.');
  const descriptor = fs.openSync(output, 'r'), header = Buffer.alloc(2);
  try { if (fs.readSync(descriptor, header, 0, 2, 0) !== 2 || header.toString('ascii') !== 'MZ') fail('Signed target is not a Windows executable.'); }
  finally { fs.closeSync(descriptor); }
}

function githubURL(route, upload = false) {
  const url = new URL(route, upload ? 'https://uploads.github.com' : 'https://api.github.com');
  if (url.protocol !== 'https:' || url.hostname !== (upload ? 'uploads.github.com' : 'api.github.com') || url.username || url.password || url.port || url.hash || !url.pathname.startsWith(API_PREFIX + '/releases')) fail('Unexpected authenticated GitHub endpoint.');
  return url;
}
function github(method, route, { body, file, upload = false, allow404 = false } = {}) {
  const url = githubURL(route, upload);
  const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const length = file ? fs.statSync(file).size : payload?.length;
  return new Promise((resolve, reject) => {
    let complete = false, input;
    const finish = (error, result) => { if (complete) return; complete = true; clearTimeout(timer); error ? reject(error) : resolve(result); };
    const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'Xispa-Binary-Publisher/1', 'X-GitHub-Api-Version': '2022-11-28' };
    if (length !== undefined && length !== null) { headers['Content-Length'] = length; headers['Content-Type'] = file ? 'application/octet-stream' : 'application/json'; }
    const request = https.request(url, { method, headers, timeout: 60000 }, response => {
      const chunks = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > 4 * 1024 * 1024) { response.destroy(); request.destroy(); finish(new Error('GitHub response exceeded the permitted size.')); } else chunks.push(chunk); });
      response.on('error', () => finish(new Error('GitHub response was interrupted.')));
      response.on('end', () => {
        if (complete) return;
        const status = response.statusCode || 0;
        if (status === 404 && allow404) return finish(null, null);
        if (status < 200 || status >= 300) return finish(new Error('GitHub ' + method + ' failed with HTTP ' + status + '. No existing release assets were deleted.'));
        if (!/^application\/json(?:;|$)/i.test(response.headers['content-type'] || '')) return finish(new Error('GitHub returned an unexpected response type.'));
        let value; try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return finish(new Error('GitHub returned invalid JSON.')); }
        finish(null, value);
      });
    });
    const timer = setTimeout(() => { request.destroy(); input?.destroy(); finish(new Error('Authenticated GitHub request timed out.')); }, 10 * 60 * 1000);
    request.on('timeout', () => { request.destroy(); input?.destroy(); finish(new Error('Authenticated GitHub request stalled.')); });
    request.on('error', () => { input?.destroy(); finish(new Error('Authenticated GitHub request failed.')); });
    // Authorization is never followed across a redirect or printed to logs.
    if (file) { input = fs.createReadStream(file); input.on('error', () => { request.destroy(); finish(new Error('Could not read the verified release asset.')); }); input.pipe(request); }
    else { if (payload) request.write(payload); request.end(); }
  });
}
function semver(value) {
  const match = /^v?(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.exec(value || '');
  if (!match) fail('Latest release has an unexpected version tag; refusing to replace it.');
  return match.slice(1).map(Number);
}
function newer(left, right) { const a = semver(left), b = semver(right); for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i]; } return false; }
function checkedRelease(release) {
  if (!record(release) || !integer(release.id, 1, Number.MAX_SAFE_INTEGER) || release.tag_name !== TAG || release.prerelease !== false || typeof release.draft !== 'boolean') fail('Unexpected release returned by GitHub.');
  return release;
}
function checkAsset(asset, expected, draft = false) {
  const canonical = 'https://github.com/' + REPOSITORY + '/releases/download/' + TAG + '/' + expected.name;
  let validURL = asset?.browser_download_url === canonical;
  if(draft && !validURL){try{const url=new URL(asset.browser_download_url);validURL=url.protocol==='https:'&&url.hostname==='github.com'&&!url.port&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname.startsWith('/'+REPOSITORY+'/releases/download/untagged-')&&url.pathname.endsWith('/'+expected.name);}catch{}}
  if (!record(asset) || !integer(asset.id, 1, Number.MAX_SAFE_INTEGER) || asset.name !== expected.name || asset.state !== 'uploaded' || asset.size !== expected.size || asset.digest !== 'sha256:' + expected.hash || !validURL) fail('Release asset differs from the verified bytes; refusing to overwrite or publish.');
}
async function listAssets(releaseId) {
  const assets = await github('GET', API_PREFIX + '/releases/' + releaseId + '/assets?per_page=100');
  if (!Array.isArray(assets) || assets.length > 2 || new Set(assets.map(asset => asset.name)).size !== assets.length || assets.some(asset => ![TARGET_EXE, 'updates.json'].includes(asset.name))) fail('Release contains unexpected assets; refusing to change it.');
  return assets;
}
async function publish(input, executable, workspace) {
  const manifest = path.join(workspace, 'updates.json'); fs.writeFileSync(manifest, input.manifestBytes, { flag: 'wx', mode: 0o600 });
  const expected = [{ name: TARGET_EXE, file: executable, size: input.release.size, hash: input.release.sha256 }, { name: 'updates.json', file: manifest, size: input.manifestBytes.length, hash: input.manifestHash }];
  const latest = await github('GET', API_PREFIX + '/releases/latest', { allow404: true });
  let release = await github('GET', API_PREFIX + '/releases/tags/' + TAG, { allow404: true });
  if (release) checkedRelease(release);
  if (!release || release.draft) {
    if (latest && newer(latest.tag_name, TAG)) fail('A newer release is already public; refusing a channel rollback.');
    if (!release) release = checkedRelease(await github('POST', API_PREFIX + '/releases', { body: { tag_name: TAG, target_commitish: process.env.GITHUB_SHA, name: 'Xispa Suite ' + VERSION, body: input.release.notes.es + '\n\n---\n\n' + input.release.notes.en, draft: true, prerelease: false, make_latest: 'false' } }));
    if (!release.draft) fail('Expected a draft before uploading assets.');
  }
  let assets = await listAssets(release.id);
  for (const item of expected) {
    const existing = assets.find(asset => asset.name === item.name);
    if (existing) { checkAsset(existing, item, release.draft); continue; }
    if (!release.draft) fail('Published release is incomplete; refusing to modify it.');
    const created = await github('POST', API_PREFIX + '/releases/' + release.id + '/assets?name=' + encodeURIComponent(item.name), { file: item.file, upload: true });
    checkAsset(created, item, true);
  }
  assets = await listAssets(release.id);
  if (assets.length !== 2) fail('Both verified assets must exist before publishing.');
  expected.forEach(item => checkAsset(assets.find(asset => asset.name === item.name), item, release.draft));
  if (release.draft) {
    // Recheck the live channel after uploads; concurrency protects this workflow,
    // while this check also detects manual publications made during the upload.
    const currentLatest = await github('GET', API_PREFIX + '/releases/latest', { allow404: true });
    if (currentLatest && newer(currentLatest.tag_name, TAG)) fail('A newer version was published during this run; draft preserved.');
    release = checkedRelease(await github('PATCH', API_PREFIX + '/releases/' + release.id, { body: { draft: false, prerelease: false, make_latest: 'true' } }));
    if (release.draft) fail('GitHub did not publish the verified draft.');
  }
  const publishedAssets = await listAssets(release.id);
  expected.forEach(item => checkAsset(publishedAssets.find(asset => asset.name === item.name), item));
  console.log('Published verified Xispa Suite ' + VERSION + ': https://github.com/' + REPOSITORY + '/releases/tag/' + TAG);
  console.log('Executable SHA-256: ' + input.release.sha256 + '; bytes: ' + input.release.size);
}
async function main() {
  if (String(process.env.GITHUB_REPOSITORY || '').toLowerCase() !== REPOSITORY.toLowerCase() || process.env.GITHUB_REF !== 'refs/heads/main' || process.env.GITHUB_EVENT_NAME !== 'push' || !/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || '')) fail('This publisher only runs for a push to the expected repository main branch.');
  token = process.env.GITHUB_TOKEN || '';
  if (!token || /[\r\n]/.test(token)) fail('A workflow GITHUB_TOKEN with contents:write is required.');
  const input = validateInputs(path.join(process.cwd(), 'distribution', VERSION));
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'xispa-publish-'));
  const zip = path.join(workspace, 'base.zip'), base = path.join(workspace, 'base.exe'), target = path.join(workspace, TARGET_EXE);
  await downloadBase(zip); extractBase(zip, base, input.delta.baseSize);
  if (await digest(base) !== BASE_EXE_SHA256) fail('Pinned base executable changed before reconstruction.');
  reconstruct(base, target, input.delta);
  console.log('Signed binary reconstructed and verified; executable will not be run.');
  await publish(input, target, workspace);
  // The isolated runner removes its temporary workspace after the job. No
  // existing release, user file or application data is ever deleted here.
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
