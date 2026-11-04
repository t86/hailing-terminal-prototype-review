'use strict';
// V1.5-r6 可审阅 fixture（产品定稿决议 v15-r5-decisions）：
// 决议1 管理账号一律全台账，受范围限制的账号只读、不能管理账号；
// 决议2 无启用管理账号时，Windows 提权恢复模式可新建一个管理员；
// 决议3 备份数据密钥 DK：DPAPI（本机）+ 口令（异机）各包裹一份；密钥轮换保留旧备份恢复路径；第二备份目的地提示。
// 只改内存演示状态：不连接业务后台、不读写真实数据库/系统目录/DPAPI，不向设备发送任何请求。
(() => {
  const X = window.prototypeLocal15r3, LX = window.prototypeLocal15, digest = LX.digest, L = state.local15;
  const MANAGER = new Set(['admin', 'maint']);
  const users = () => [...Object.values(accounts), ...state.extraUsers];
  const findUser = a => users().find(u => u.account === a);
  const actor = () => state.user ? findUser(state.user.account) : null;
  const isMgrRole = u => !!u && MANAGER.has(u.role);
  const enabledManagers = () => users().filter(u => isMgrRole(u) && !u.disabled);
  const stamp = () => new Date(Date.now() + (L.clockSkew || 0)).toLocaleString('zh-CN', {hour12:false});
  const audit = (action, target, user, result = '已记录') => state.audit.unshift({time: stamp(), user: user || state.user?.name || '本机', owner: state.user?.account || 'system', action, target, result});
  const deny = (reason, message) => { toast(message, 'error'); return {ok:false, reason}; };
  const rnd = () => Math.random().toString(36).slice(2, 10);

  // ---------- 决议1：管理账号固定全台账 ----------
  const normalize = u => { if (isMgrRole(u)) { u.allDevices = true; u.groups = []; u.scope = []; } };
  users().forEach(normalize);
  const needManager = () => { const a = actor(); if (!a || !isMgrRole(a) || a.disabled) return deny('NOT_MANAGER', '只有管理账号可以管理账号与授权；受范围限制的账号为只读'); return null; };
  const MUST_GLOBAL = () => deny('MANAGER_MUST_BE_GLOBAL', '管理账号的范围固定为全台账，不能设置分组或单台范围');
  for (const name of ['disableUser', 'enableUser', 'deleteUser', 'setUserRole', 'resetUserPassword', 'editUser', 'unlockUser', 'addUser', 'confirmAddUser', 'saveUserScope', 'saveUserGroups', 'setUserAllDevices', 'saveUserGrant']) {
    const prev = C[name]; if (!prev) continue;
    C[name] = function (account, ...rest) {
      const n = needManager(); if (n) return n;
      const u = typeof account === 'string' ? findUser(account) : null;
      if (u && isMgrRole(u)) {
        if (['saveUserScope', 'saveUserGroups', 'saveUserGrant'].includes(name)) return MUST_GLOBAL();
        if (name === 'setUserAllDevices' && !rest[0]) return MUST_GLOBAL();
        if (name === 'editUser') { modal('调整授权 · ' + u.name, `<p>${h(u.name)}（${h(u.account)}）是${u.role === 'admin' ? '管理员' : '维护'}。</p>${notice('全台账（管理账号固定）。如需限定分组或单台范围，请先将其角色改为只读（须保留至少一个启用的管理账号）。')}`, btn('关闭', 'C.closeModal()')); return {ok:true, fixedGlobal:true}; }
      }
      const wasMgr = u ? isMgrRole(u) : false;
      const r = prev.call(C, account, ...rest);
      if (name === 'setUserRole' && u && r?.ok !== false) {
        if (isMgrRole(u)) normalize(u);
        else if (wasMgr) { u.allDevices = false; u.groups = []; u.scope = []; toast('已降为只读：请为该账号选择分组或单台范围（默认无可见终端）'); }
      }
      if (name === 'confirmAddUser') { const last = state.extraUsers[state.extraUsers.length - 1]; if (last) normalize(last); }
      if (name === 'resetUserPassword' && u && r?.ok) { const by = state.user?.name || '管理账号'; u.resetNotice = `上次由 ${by} 于 ${stamp()} 重置，请修改密码`; u.resetBy = {by, at: stamp()}; }
      return r;
    };
  }
  // r7：新增账号表单按角色切换授权区。管理员/维护只显示“全台账（管理账号固定）”，不出现分组/单台选择；
  // 只读显示授权分组与单台终端。提交时再校验：管理角色携带任何范围一律拒绝（不静默改写）。
  const GLOBAL_NOTE = '全台账（管理账号固定）：管理员与维护可查看和管理本机全部终端，不设置分组或单台范围。';
  const scopeArea = role => MANAGER.has(role)
    ? `<div id="new-user-scope-area" data-scope="global">${notice(GLOBAL_NOTE)}</div>`
    : `<div id="new-user-scope-area" data-scope="limited"><h3>授权分组（按分组当前成员，不含子分组）</h3>${[...new Set(state.devices.map(d => d.project))].map(g => `<label class="target-row"><input type="checkbox" name="new-user-group" value="${h(g)}">${h(g)}</label>`).join('')}<h3>单台终端授权</h3>${state.devices.map(d => `<label class="target-row"><input type="checkbox" name="new-user-scope" value="${d.id}">${h(d.name)} · ${h(d.sn)}</label>`).join('')}<p class="hint">只读账号只能查看授权范围内的终端，不能修改设备或管理账号。</p></div>`;
  const prevAddUser6 = C.addUser;
  C.addUser = function (role) {
    const r = prevAddUser6.call(C); if (r && r.ok === false) return r;
    const root = document.getElementById('modal-root'); if (!root?.innerHTML?.includes('new-user-name')) return r;
    role = roleNames[role] ? role : 'viewer';
    let html = root.innerHTML; const i = html.indexOf('<h3>单台终端授权</h3>'), j = html.indexOf('<p class="hint">账号保存在本机');
    if (i >= 0 && j > i) html = html.slice(0, i) + scopeArea(role) + html.slice(j);
    html = html.replace('<select id="new-user-role">', '<select id="new-user-role" onchange="C.addUserRole(this.value)">').replace(`<option value="${role}">`, `<option value="${role}" selected>`);
    root.innerHTML = html; const sel = document.getElementById('new-user-role'); if (sel) sel.value = role;
    return {ok:true, role, scope: MANAGER.has(role) ? 'global' : 'limited'};
  };
  C.addUserRole = function (role) {
    const keep = ['new-user-name', 'new-user-account', 'new-user-pw', 'new-user-pw2'].map(id => [id, document.getElementById(id)?.value]);
    const r = C.addUser(role); for (const [id, v] of keep) { const el = document.getElementById(id); if (el && v != null) el.value = v; } return r;
  };
  const prevConfirmAdd6 = C.confirmAddUser;
  C.confirmAddUser = function () {
    const n = needManager(); if (n) return n;
    const role = document.getElementById('new-user-role')?.value;
    const groups = [...document.querySelectorAll('[name="new-user-group"]:checked')].map(x => x.value);
    const scope = [...document.querySelectorAll('[name="new-user-scope"]:checked')].map(x => Number(x.value));
    if (MANAGER.has(role) && (groups.length || scope.length)) return deny('MANAGER_MUST_BE_GLOBAL', '管理员与维护固定为全台账，不能选择分组或单台终端；如需限定范围请选择“只读”');
    const before = state.extraUsers.length; const r = prevConfirmAdd6.apply(C, arguments);
    if (state.extraUsers.length > before) { const u = state.extraUsers[state.extraUsers.length - 1];
      if (MANAGER.has(u.role)) normalize(u); else { u.allDevices = false; u.groups = groups.filter(g => state.devices.some(d => d.project === g)); } render(); }
    return r;
  };
  // 受范围限制的只读账号（审阅用）：保留 B02 范围；旧审阅入口名沿用，语义改为只读
  C.reviewSeedRestricted = function () { const old = findUser('zhao'); if (old) return old; const u = {name:'赵工（受限）', account:'zhao', role:'viewer', initial:'赵', scope:[], groups:['滨江雅苑'], allDevices:false}; state.extraUsers.push(u); render(); return u; };
  C.reviewSeedLimitedMaint = C.reviewSeedRestricted;

  // ---------- 决议2：恢复模式新建管理员 ----------
  const genCode = () => Array.from({length:4}, () => rnd().slice(0, 4).toUpperCase()).join('-');
  const prevOsReset = C.osAdminReset;
  C.osAdminReset = function (opts = {}) {
    const u = findUser(opts.account);
    if (opts.elevated && opts.isAdministrator && u && !u.disabled && !isMgrRole(u)) return {ok:false, reason:'NOT_MANAGER_ACCOUNT', message:'恢复模式只能重置启用的管理账号；只读账号由管理账号重置'};
    const r = prevOsReset.call(C, opts);
    if (r?.ok) state.audit[0].result += ` · 会话：${opts.sessionType === 'rdp' ? '远程桌面' : '控制台'} · Windows 用户：${opts.windowsUser || '未记录'} · 机器：${opts.machine || '本机'}`;
    return r;
  };
  // r7：账号、临时密码哈希、恢复码哈希与审计在同一事务内提交；任一步失败整体回滚，提交成功后才返回一次性秘密。
  // 演示用 L.recoveryFault 模拟某一步失败（'account' | 'password' | 'recovery' | 'audit' | 'commit'）。
  C.osAdminCreateAdmin = function ({elevated = false, isAdministrator = false, cliFlag = false, sessionType = 'console', windowsUser = '', machine = '', reason = '', confirm = false, name = '', account = ''} = {}) {
    if (!elevated || !isAdministrator) return {ok:false, reason:'NOT_ELEVATED', message: cliFlag ? '命令行参数不能代替 Windows 管理员提权校验' : '须以 Windows 管理员身份提权运行'};
    if (enabledManagers().length) return {ok:false, reason:'MANAGER_EXISTS', message:'仍有启用的管理账号：恢复模式只能为其重置密码，不能新建管理员'};
    if (!reason || !confirm) return {ok:false, reason:'NEED_CONFIRM'};
    if (!state.platform) return {ok:false, reason:'STORE_UNAVAILABLE', message:'本机库不可写，未改动任何数据'};
    if (!name || !/^[A-Za-z0-9_.-]{2,64}$/.test(account)) return {ok:false, reason:'BAD_INPUT'};
    if (findUser(account)) return {ok:false, reason:'ACCOUNT_EXISTS'};
    let temp = 'Tmp-' + rnd().slice(0, 6) + '7', code = genCode();
    const fault = L.recoveryFault || null, fail = step => ({ok:false, reason:'TX_ROLLED_BACK', step, message:'恢复模式写入失败，事务已回滚：未创建账号、未保存任何密码或恢复码、未写审计；请检查本机库后重试'});
    // 事务暂存区：只在内存中组装，提交前对 state 零写入
    const tx = {};
    tx.user = {name, account, role:'admin', initial:name[0], allDevices:true, groups:[], scope:[], mustChangePassword:true, resetNotice:'由 Windows 管理员在恢复模式中创建，请修改密码'};
    if (fault === 'account') { temp = code = null; return fail('account'); }
    tx.user.pwdHash = digest(temp);
    if (fault === 'password') { temp = code = null; return fail('password'); }
    tx.recovery = {hash:digest(code), used:false};
    if (fault === 'recovery') { temp = code = null; return fail('recovery'); }
    tx.audit = {time: stamp(), user:'Windows 管理员', owner:'system', action:'恢复模式新建管理员', target:account, result:`原因：${reason} · 会话：${sessionType === 'rdp' ? '远程桌面' : '控制台'} · Windows 用户：${windowsUser || '未记录'} · 机器：${machine || '本机'}`};
    if (fault === 'audit') { temp = code = null; return fail('audit'); }
    if (fault === 'commit') { temp = code = null; return fail('commit'); }
    // COMMIT：三类记录一次性生效
    state.extraUsers.push(tx.user); L.recovery[account] = tx.recovery; state.audit.unshift(tx.audit);
    L.recoverySecretShown = {account, at: stamp()};          // 只记录“已显示过”，不记录秘密本身
    return {ok:true, temp, recoveryCode:code, notice:'临时密码与恢复码只显示这一次；关闭后无法再次查看'};
  };

  // ---------- 决议3：备份密钥 DK + DPAPI + 口令包裹 ----------
  const K = L.backupKeys = L.backupKeys || {keyring:[{dkId:'dk-1', protectedBy:'DPAPI LocalMachine（演示）', status:'active'}], wrap:null, dpapiAvailable:true};
  // r7 契约（演示，不是真实密码学）：
  //  - wrappedDK = AES-256-GCM(KEK, 随机 96 位 nonce, DK, AAD = 格式|DK 标识|KDF 算法与参数|盐)：改动这些头部字段即解包失败；
  //  - 每个备份生成唯一 fileSalt，正文子密钥 = HKDF-SHA256(DK, fileSalt, "ysbak/2|" + 备份标识)，块 nonce = 块序号，
  //    因此同一 DK 跨全部备份、全部分块的 (子密钥, nonce) 不会重复；fileSalt 在密钥环登记，重复即拒绝；
  //  - 每块 AAD = 文件头摘要 | 块序号 | 是否末块：头部任一字段被改、块被替换或重排都认证失败。
  const FORMAT = 'ysbak/2', KDF = {alg:'Argon2id', params:'待目标机实测'};
  const aadOf = (dkId, salt, format = FORMAT, kdf = KDF) => [format, dkId, kdf.alg, kdf.params, salt].join('|');
  const passTag = (pass, salt, dkId, aad = aadOf(dkId, salt)) => digest('kek|' + pass + '|' + aad);
  const setWrap = (pass, dkId) => { const salt = rnd(); K.wrap = {dkId, salt, nonce: rnd() + rnd().slice(0, 4), tag: passTag(pass, salt, dkId), kdf:{...KDF}, setAt: stamp()}; };
  setWrap('Demo-Backup-2026', 'dk-1');                 // 演示初始口令；口令本身不保存
  K.usedFileSalts = K.usedFileSalts || [];
  const activeDk = () => K.keyring.find(k => k.status === 'active').dkId;
  const headerOf = b => { const c = b.crypto; return JSON.stringify([c.format, c.schema, b.id, c.dkId, c.kdf, c.wrappedDK, c.fileSalt, c.chunkCount, c.nonceScheme]); };
  const chunkTag = (b, dk, i) => digest('chunk|' + dk + '|' + b.crypto.fileSalt + '|' + i + '|' + (i === b.crypto.chunkCount - 1 ? 'final' : 'more') + '|' + digest(headerOf(b)));
  const sealWithSalt = (b, fileSalt, dkId) => {
    if (K.usedFileSalts.includes(dkId + '|' + fileSalt)) return {ok:false, reason:'NONCE_REUSE', message:'该数据密钥下的 fileSalt 已用过，拒绝复用（防 nonce 重复）'};
    K.usedFileSalts.push(dkId + '|' + fileSalt);
    b.crypto = {format:FORMAT, schema:'1.5', dkId, kdf:{...K.wrap.kdf, salt:K.wrap.salt}, wrappedDK:{...K.wrap}, fileSalt, chunkCount:3, nonceScheme:'HKDF(DK,fileSalt)→每备份子密钥；块 nonce=块序号'};
    b.crypto.chunks = Array.from({length:b.crypto.chunkCount}, (_, i) => ({index:i, nonce:i, tag:chunkTag(b, dkId, i)}));
    b.crypto.bodyTag = digest('body|' + dkId + '|' + b.id);
    return {ok:true};
  };
  const seal = b => { const dkId = b.crypto?.dkId || activeDk(); let s; do { s = rnd() + rnd(); } while (K.usedFileSalts.includes(dkId + '|' + s)); sealWithSalt(b, s, dkId); return b; };
  L.backups.forEach(seal);
  for (const fn of ['createBackup', 'runAutoBackup']) { const prev = C[fn]; C[fn] = function () { const r = prev.apply(C, arguments); if (r?.ok && r.backup) { delete r.backup.crypto; seal(r.backup); } return r; }; }
  C.decryptBackup = function (id, {machine = 'this', passphrase = null} = {}) {
    const b = L.backups.find(x => x.id === id); if (!b?.crypto) return {ok:false, reason:'NOT_FOUND'};
    const c = b.crypto; let dk = null, via = null;
    if (machine === 'this' && K.dpapiAvailable && K.keyring.some(k => k.dkId === c.dkId)) { dk = c.dkId; via = 'DPAPI'; }
    else if (passphrase == null) return {ok:false, reason:'NEED_PASSPHRASE', message:'异机或本机 DPAPI 不可用：请输入该备份设置时的备份口令'};
    else { const w = c.wrappedDK; const aad = aadOf(c.dkId, c.kdf?.salt, c.format, c.kdf || {}); if (w.dkId !== c.dkId || passTag(passphrase, w.salt, w.dkId, aad) !== w.tag) return {ok:false, reason:'BAD_PASSPHRASE', message:'口令错误或文件头被篡改：认证失败，未改动当前数据'}; dk = w.dkId; via = 'PASSPHRASE'; }
    if (c.format !== FORMAT || !Array.isArray(c.chunks) || c.chunks.length !== c.chunkCount) return {ok:false, reason:'AUTH_FAILED', message:'备份文件头认证失败，已拒绝；当前数据未改变'};
    for (let i = 0; i < c.chunkCount; i++) { const ch = c.chunks[i]; if (ch.index !== i || ch.nonce !== i || ch.tag !== chunkTag(b, dk, i)) return {ok:false, reason:'AUTH_FAILED', message:'备份文件认证失败（文件头或分块被篡改），已拒绝；当前数据未改变'}; }
    if (c.bodyTag !== digest('body|' + dk + '|' + b.id)) return {ok:false, reason:'AUTH_FAILED', message:'备份文件认证失败（可能被篡改），已拒绝；当前数据未改变'};
    return {ok:true, via, dkId:dk};
  };
  const prevPreview = C.previewRestore;
  C.previewRestore = function (id, opts) {
    const b = L.backups.find(x => x.id === id);
    if (b && b.checksum === 'ok' && b.crypto && state.user && isMgrRole(actor())) { const d = C.decryptBackup(id, opts || {}); if (!d.ok) { L.restorePreview = null; toast(d.message || '无法解密该备份', 'error'); return d; } }
    return prevPreview.apply(C, arguments);
  };
  C.setBackupPassphrase = function (pass, confirmPass) {
    const n = needManager(); if (n) return n;
    if (!pass || pass !== confirmPass) return deny('MISMATCH', '两次口令不一致');
    if (pass.length < 12) return deny('WEAK', '备份口令至少 12 位');
    setWrap(pass, activeDk()); L.autoBackup.passphraseSet = true;
    audit('修改备份口令', '备份加密');
    return {ok:true, notice:'此后的新备份使用新口令；之前的备份仍需当时的口令在其他电脑恢复（本机可直接恢复）。口令遗失将无法在其他电脑或重装系统后恢复备份。'};
  };
  C.rotateBackupKey = function (pass) {
    const n = needManager(); if (n) return n;
    if (!K.wrap || passTag(pass || '', K.wrap.salt, K.wrap.dkId) !== K.wrap.tag) return deny('BAD_PASSPHRASE', '请输入当前备份口令以包裹新的数据密钥');
    const old = K.keyring.find(k => k.status === 'active'); old.status = 'retired';   // 旧 DK 仍由 DPAPI 保护保留，用于恢复旧备份
    const dkId = 'dk-' + (K.keyring.length + 1); K.keyring.push({dkId, protectedBy:'DPAPI LocalMachine（演示）', status:'active'});
    setWrap(pass, dkId); audit('轮换备份数据密钥', dkId);
    return {ok:true, dkId, retired: old.dkId};
  };
  C.purgeBackupKey = function (dkId) {
    const n = needManager(); if (n) return n;
    const k = K.keyring.find(x => x.dkId === dkId); if (!k) return {ok:false, reason:'NOT_FOUND'};
    if (k.status === 'active') return deny('KEY_ACTIVE', '当前数据密钥不能删除');
    if (L.backups.some(b => b.crypto?.dkId === dkId)) return deny('KEY_IN_USE', '仍有备份使用该数据密钥，不能删除（否则本机将无法直接恢复这些备份）');
    K.keyring.splice(K.keyring.indexOf(k), 1); audit('删除已无备份引用的旧数据密钥', dkId); return {ok:true};
  };
  // 第二备份目的地
  Object.assign(L.autoBackup, {secondDest: L.autoBackup.secondDest ?? null, secondDestAvailable: true, secondFailures: 0});
  const SECOND_WARN = '尚未配置第二个备份目的地（U 盘或网络共享）';
  const prevSaveAuto = C.saveAutoBackup;
  C.saveAutoBackup = function (cfg = {}) { const r = prevSaveAuto.apply(C, arguments); if (r?.ok && 'secondDest' in cfg) L.autoBackup.secondDest = cfg.secondDest || null; return r; };
  const prevRunAuto = C.runAutoBackup;
  C.runAutoBackup = function () { const r = prevRunAuto.apply(C, arguments); const a = L.autoBackup;
    if (r?.ok && a.secondDest) { if (a.secondDestAvailable) a.secondLast = '成功'; else { a.secondFailures++; a.secondLast = '失败：第二目的地不可用'; } }
    return r; };
  const backupWarning = () => { const a = L.autoBackup; return !a.secondDest ? SECOND_WARN : a.secondFailures ? `第二个备份目的地写入失败 ${a.secondFailures} 次` : ''; };
  const prevSettings = settings;
  settings = function () { const html = prevSettings.apply(this, arguments); const w = backupWarning(); const a = actor();
    return html + (a ? `<section class="card"><h2>备份</h2>${w ? notice(w, 'amber') : '<p class="hint">已配置第二个备份目的地。</p>'}<p class="hint">备份由数据密钥加密：本机用 Windows DPAPI（本机范围）保护的密钥自动备份与恢复；在其他电脑或重装系统后恢复需要备份口令。本机任何能运行程序的用户都可能解开 DPAPI 保护的密钥——加密用于保护离开本机的备份文件，不防本机用户。</p><p class="hint">口令遗失将无法在其他电脑或重装系统后恢复备份。修改口令后，之前的备份仍需当时的口令；轮换数据密钥后，旧密钥保留用于恢复旧备份。</p></section>` : ''); };
  const prevDiag = C.diagnostics;
  C.diagnostics = function () { const r = prevDiag.apply(C, arguments); const root = document.getElementById('modal-root'); const w = backupWarning(); if (w && root?.innerHTML) root.innerHTML = root.innerHTML.replace('</p>', `</p><p class="hint">${h(w)}</p>`); return r; };

  // ---------- 补充：升级前适配校验按“当前”本机包库/兼容索引执行（任务创建后撤销同样拦截） ----------
  // 升级后同 SN 版本回读只是完成判定；这里在每台发送 upload_pkg 之前再查一次包状态与 sha256。
  // r7：以稳定包身份（版本 + sha256）在“当前”本机包库中找有效登记；任务创建时绑定 sha256；
  // 执行前登记缺失（包被删除）、sha256 不一致、撤销或适配未确认，一律不发送任何设备写请求。
  const prevUpgradeReason = upgradeReason;
  upgradeReason = function (d, pkg, target) {
    if (pkg && pkg.version) {
      if (!pkg.sha256) return '缺少软件包 sha256 身份或适配元数据，禁止升级（未发送升级请求）';
      const lib = (L.packages || []).find(p => p.version === pkg.version && p.sha256 === pkg.sha256);
      if (!lib) return (L.packages || []).some(p => p.version === pkg.version) ? '软件包 sha256 与本机登记不一致，禁止升级（未发送升级请求）' : '软件包已不在本机包库（已删除），禁止升级（未发送升级请求）';
      if (lib.status !== 'known') return '软件包已撤销或适配未确认，禁止升级（升级前适配校验未通过，未发送升级请求）';
    }
    return prevUpgradeReason(d, pkg, target);
  };
  const prevCreateTask = createTask;
  createTask = function (kind, title, ids, stages, note, spec = {}) {
    if (kind === 'upgrade' && spec?.request?.package && !spec.request.package.sha256) {
      const lib = (L.packages || []).find(p => p.version === spec.request.package.version && p.status === 'known');
      if (lib) spec = {...spec, request:{...spec.request, package:{...spec.request.package, sha256: lib.sha256}}};
    }
    return prevCreateTask.call(this, kind, title, ids, stages, note, spec);
  };
  C.removePackage = function (version) {
    const n = needManager(); if (n) return n;
    const k = (L.packages || []).findIndex(p => p.version === version); if (k < 0) return {ok:false, reason:'NOT_FOUND'};
    L.packages.splice(k, 1); audit('从本机包库删除软件包', version); render(); return {ok:true};
  };

  // ---------- r8：上传前按“实际文件字节”校验升级包；校验与上传用同一份不可替换快照 ----------
  // 演示：受控目录以 L.pkgStore（文件名 → 内容）模拟；fileSha 以查表 + FNV 摘要代替真实 SHA-256，不是真实哈希或文件读写实现。
  // 每台发送 upload_pkg 前：按任务绑定的“版本 + sha256”找到有效登记 → 打开文件读成快照 → 对快照字节重算 sha256，
  // 与任务绑定值、登记值同时比较；文件缺失、读取失败或不符一律零设备写请求。upload_pkg 发送的就是这份快照，
  // 校验之后受控目录里的文件再被替换也不影响本次发送的内容。
  const pkgDemoBytes = f => 'YS-PKG-DEMO-BYTES|' + f;
  const KNOWN_SHA = new Map();
  L.pkgStore = L.pkgStore || {};
  const registerFile = p => { if (p?.file && !(p.file in L.pkgStore)) { L.pkgStore[p.file] = pkgDemoBytes(p.file); KNOWN_SHA.set(pkgDemoBytes(p.file), p.sha256); } };
  (L.packages || []).forEach(registerFile);
  const fileSha = bytes => KNOWN_SHA.get(bytes) || ('sha256-fixture:' + digest(bytes));
  const openPackageSnapshot = file => {
    if (L.pkgReadFault === file) return {ok:false, message:'升级包文件无法读取，未发送升级请求'};
    if (!file || !(file in L.pkgStore)) return {ok:false, message:'升级包文件已不在本机包库目录（缺失），未发送升级请求'};
    const bytes = String(L.pkgStore[file]);                           // 一次读入；之后只使用这份快照
    return {ok:true, snap:Object.freeze({file, bytes, size:bytes.length, sha256:fileSha(bytes)})};
  };
  const prevImportPkg8 = C.confirmImportPackage;
  C.confirmImportPackage = function () { const r = prevImportPkg8.apply(C, arguments); (L.packages || []).forEach(registerFile); return r; };
  const prevBuild8 = buildFlowSteps;
  buildFlowSteps = function (t, r) {
    const steps = prevBuild8(t, r);
    if (t.kind !== 'upgrade') return steps;
    const pkg = t.request?.package || {}, bound = pkg.sha256, version = pkg.version || t.request?.targetVersion;
    const verify = {action:'打开升级包并重算 sha256', write:false, failure() {
      const lib = (L.packages || []).find(p => p.version === version && p.sha256 === bound && p.status === 'known');
      if (!bound || !lib) return '软件包登记已变化（删除、替换或撤销），未发送升级请求';
      const o = openPackageSnapshot(lib.file); if (!o.ok) return o.message;
      if (o.snap.sha256 !== bound || o.snap.sha256 !== lib.sha256) return '升级包文件实际内容与登记的 sha256 不符（文件可能损坏或被替换），未发送升级请求';
      r.pkgSnapshot = o.snap; r.evidence.packageBytesSha256 = o.snap.sha256;
      if (typeof L.onPackageVerified === 'function') L.onPackageVerified(lib.file, t, r);   // 审阅/测试钩子：模拟校验后文件被替换
      return null;
    }};
    const i = steps.findIndex(s => s.action === 'upload_pkg');
    if (i >= 0) {
      const up = steps[i];
      Object.defineProperty(up, 'data', {enumerable:true, get() { const s = r.pkgSnapshot; return s ? {package:s.file, size:s.size, sentSha256:fileSha(s.bytes), source:'与校验相同的快照'} : {package:null}; }});
      steps.splice(i, 0, verify);
    }
    return steps;
  };

  // 账号页文案（决议1）：管理账号看到全部账号；不再出现“范围不超过自己/授予上限”的推导规则
  const prevAdmin6 = admin;
  admin = function () { let html = prevAdmin6.apply(this, arguments);
    return html.replace('你只能管理范围不超过自己的账号，且不能授予超出自己的范围。', '管理员与维护为管理账号，授权范围固定为全台账；分组/单台范围只适用于只读账号（不含子分组）。受范围限制的账号只读，不能管理任何账号。')
      .replace("btn('添加受限维护账号（审阅）'", "btn('添加受限账号（审阅）'").replace('添加受限维护账号（审阅）', '添加受限账号（审阅）'); };
  // 打印/导出恢复单：不含口令本身
  C.exportRecoverySheet = function () {
    const n = needManager(); if (n) return n;
    const a = L.autoBackup, sheet = {title:'海菱终端管理 · 备份恢复单', passphraseHint:'备份口令不在本单中；请按单位规定保存在离线位置（例如密封信封/保险柜），并在此处登记存放位置', destinations:[a.dest || 'ProgramData\\backups', a.secondDest || '（尚未配置第二个备份目的地）'], passphraseSetAt: K.wrap?.setAt, dkId: activeDk(), warning:'口令遗失将无法在其他电脑或重装系统后恢复备份'};
    audit('导出备份恢复单', '备份加密');
    return {ok:true, sheet};
  };
  window.prototypeLocal15r6 = {enabledManagers, decryptBackup: C.decryptBackup, backupWarning, sealWithSalt, headerOf, fileSha, openPackageSnapshot};
  render();
})();
