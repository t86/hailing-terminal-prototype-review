'use strict';
// V1.5-r3 可审阅 fixture：采集生命周期、分组授权、管理范围、强制改密、失败锁定、兜底重置、
// 恢复安全检查点、自动备份、可编辑导入映射、兼容索引版本与撤销、受控数据迁移。
// 只改内存演示状态：不连接业务后台、不读写真实数据库/系统目录、不向设备发送任何请求。
(() => {
  const G = window.prototypeSupport.guard, LX = window.prototypeLocal15, digest = LX.digest;
  const L = state.local15;
  const MANAGER = new Set(['admin','maint']);
  const users = () => [...Object.values(accounts), ...state.extraUsers];
  const findUser = a => users().find(u => u.account === a);
  const allIds = () => state.devices.map(d => d.id);
  const uniq = a => [...new Set(a)];
  const now = () => Date.now() + (L.clockSkew || 0);
  const audit = (action, target, extra = '') => state.audit.unshift({time: new Date(now()).toLocaleString('zh-CN', {hour12:false}), user: state.user?.name || extra || '本机', owner: state.user?.account || 'system', action, target, result: '已记录'});

  // ---------- 授权模型：全台账 / 分组（当前成员）/ 单台 ----------
  for (const k of ['admin','maint']) if (accounts[k]) accounts[k].allDevices = true;
  for (const u of users()) u.groups = u.groups || [];
  const members = groups => state.devices.filter(d => (groups || []).includes(d.project)).map(d => d.id);
  const effScope = u => !u ? [] : u.allDevices ? allIds() : uniq([...(u.scope || []), ...members(u.groups)]);
  const isManager = u => !!u && MANAGER.has(u.role) && !u.disabled;
  const isGlobal = u => isManager(u) && !!u.allDevices;
  const actor = () => state.user ? findUser(state.user.account) : null;
  const subset = (a, b) => a.every(x => b.includes(x));
  function canManage(target) {
    const a = actor();
    if (!a || !isManager(a)) return {ok:false, reason:'NOT_MANAGER', message:'当前账号没有账号管理能力'};
    if (isGlobal(a)) return {ok:true};
    if (target.allDevices) return {ok:false, reason:'TARGET_WIDER', message:'目标账号拥有全台账范围，超出你的管理范围'};
    if (!subset(target.groups || [], a.groups || [])) return {ok:false, reason:'TARGET_WIDER', message:'目标账号的授权分组超出你的管理范围'};
    if (!subset(effScope(target), effScope(a))) return {ok:false, reason:'TARGET_WIDER', message:'目标账号的终端范围超出你的管理范围'};
    return {ok:true};
  }
  function canGrant({groups = [], devices = [], allDevices = false}) {
    const a = actor();
    if (isGlobal(a)) return {ok:true};
    if (allDevices) return {ok:false, reason:'GRANT_EXCEEDS', message:'只有全台账管理账号可以授予全台账范围'};
    if (!subset(groups, a?.groups || [])) return {ok:false, reason:'GRANT_EXCEEDS', message:'不能授予你未获授权的分组'};
    if (!subset(devices, effScope(a))) return {ok:false, reason:'GRANT_EXCEEDS', message:'不能授予你范围外的终端'};
    return {ok:true};
  }
  const W = () => { if (!G(true, null, true)) return false; if (!state.platform) { toast('本机台账库不可用，不能改写本机数据', 'error'); return false; } return true; };
  const WG = () => { if (!W()) return false; if (!isGlobal(actor())) { toast('该操作影响全部账号与台账，仅全台账管理账号可用', 'error'); return false; } return true; };
  const deny = r => { toast(r.message, 'error'); return {ok:false, reason:r.reason}; };

  // 会话范围：未显式设置时实时按账号授权计算（分组成员变化立即生效）
  function attachScope(u) {
    if (!state.user || !u) return;
    const sess = {explicit:false, own:[], extra:[]};
    const wrap = arr => { const out = [...arr]; out.push = (...x) => { (sess.explicit ? sess.own : sess.extra).push(...x); return Array.prototype.push.apply(out, x); }; return out; };
    Object.defineProperty(state.user, 'scope', {configurable:true, enumerable:true,
      get(){ const acct = findUser(state.user?.account) || u; return wrap(sess.explicit ? sess.own : uniq([...effScope(acct), ...sess.extra]).filter(id => !acct.disabled)); },
      set(v){ sess.explicit = true; sess.own = [...(v || [])]; }});
  }

  // ---------- 采集生命周期：采集器持有全台账只读采集，不随登出/锁定停止 ----------
  L.collector = {running: true, coverage: 'all', cycles: 0, lastAt: null};
  C.collectorTick = function () {
    if (!state.service) { L.collector.running = false; return L.collector; }
    L.collector.running = true; L.collector.cycles++; L.collector.lastAt = new Date(now()).toISOString();
    state.devices.forEach(d => { if (d.online === 'online' && !d.sampleError && !d.stale) d.sampledAt = L.collector.lastAt; });
    return L.collector;
  };
  setInterval(() => C.collectorTick(), 5000);
  C.lockScreen = function () { if (!state.user) return; L.locked = state.user.account; C.logout(); state.loginError = ''; render(); toast('界面已锁定；采集仍在运行'); };

  // ---------- 密码策略、失败锁定、强制改密 ----------
  const WEAK = new Set(['12345678','password','password1','admin123','qwerty123','abc12345','11111111']);
  function policy(pwd, account, temp) {
    if (pwd.length < 8 || pwd.length > 128) return '密码须为8–128位';
    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return '密码须同时包含字母和数字';
    if (pwd === account) return '密码不能与账号相同';
    if (WEAK.has(pwd.toLowerCase())) return '密码过于常见';
    if (temp && pwd === temp) return '新密码不能与临时密码相同';
    return null;
  }
  L.policy = policy;
  L.failures = L.failures || {};
  const LOCK_N = 5, LOCK_MS = 15 * 60 * 1000;
  const lockedUntil = a => { const f = L.failures[a]; return f && f.until && f.until > now() ? f.until : 0; };
  const fail = a => { const f = L.failures[a] || (L.failures[a] = {count:0, until:0}); f.count++; if (f.count >= LOCK_N) { f.until = now() + LOCK_MS; f.count = 0; } };
  const pw = id => document.getElementById(id)?.value || '';

  const prevLogin = C.login;
  C.login = function () {
    const name = pw('login-account').trim(), p = pw('login-password'), u = findUser(name);
    if (u && lockedUntil(name)) { state.loginError = '连续失败次数过多，账号已暂时锁定，请稍后再试或联系管理账号解除'; render(); return {ok:false, reason:'LOCKED'}; }
    if (u?.disabled) { state.loginError = '该账号已停用'; render(); return {ok:false, reason:'DISABLED'}; }
    if (u?.pwdHash && digest(p) !== u.pwdHash) { fail(name); state.loginError = lockedUntil(name) ? '连续失败次数过多，账号已暂时锁定' : '账号或密码不匹配'; render(); return {ok:false, reason:'BAD_PASSWORD'}; }
    if (u) delete L.failures[name];
    if (u?.mustChangePassword) { L.pendingChange = {account: name, temp: p}; state.loginError = ''; render(); return {ok:false, reason:'MUST_CHANGE'}; }
    return prevLogin.apply(C, arguments);
  };
  const prevLoginAs = C.loginAs;
  C.loginAs = function (role, account = null) {
    const u = account ? findUser(account) : accounts[role];
    if (u && lockedUntil(u.account)) { state.loginError = '账号已暂时锁定'; render(); return; }
    if (u?.mustChangePassword) { if (state.user) C.logout(); L.pendingChange = {account: u.account, temp: null}; render(); return; }
    const r = prevLoginAs.apply(C, arguments);
    if (state.user) { L.pendingChange = null; L.locked = null; attachScope(findUser(state.user.account)); render(); }
    return r;
  };
  C.confirmChangePassword = function () {
    const pc = L.pendingChange; if (!pc) return {ok:false, reason:'NO_PENDING'};
    const u = findUser(pc.account); if (!u || u.disabled) { L.pendingChange = null; return {ok:false, reason:'DISABLED'}; }
    const old = pw('cp-old'), a = pw('cp-new'), b = pw('cp-new2');
    if (digest(old) !== u.pwdHash) { fail(u.account); toast('当前（临时）密码不正确', 'error'); return {ok:false, reason:'BAD_OLD'}; }
    if (a !== b) { toast('两次输入不一致', 'error'); return {ok:false, reason:'MISMATCH'}; }
    const bad = policy(a, u.account, old); if (bad) { toast(bad, 'error'); return {ok:false, reason:'POLICY'}; }
    u.pwdHash = digest(a); u.mustChangePassword = false; u.resetNotice = null; L.pendingChange = null;
    state.audit.unshift({time: new Date(now()).toLocaleString('zh-CN', {hour12:false}), user: u.name, owner: u.account, action: '修改密码', target: u.account, result: '已记录'});
    C.loginAs(u.role, u.account); return {ok:true};
  };
  C.cancelChangePassword = function () { L.pendingChange = null; render(); };
  C.unlockUser = function (account) { const u = findUser(account); if (!u || !W()) return {ok:false}; const c = canManage(u); if (!c.ok) return deny(c); delete L.failures[account]; audit('解除登录锁定', account); render(); return {ok:true}; };
  C.advanceClock = function (ms) { L.clockSkew = (L.clockSkew || 0) + ms; };
  C.simulateRestart = function () { if (state.user) C.logout(); state.service = true; render(); return {failuresPersisted: Object.keys(L.failures).length}; };

  const prevLoginView = login;
  login = function () {
    if (L.pendingChange) { const u = findUser(L.pendingChange.account); return `<div class="login-page"><section class="card login-card"><h1>首次登录：请修改密码</h1>${u?.resetNotice ? notice(h(u.resetNotice), 'amber') : ''}${notice('密码由管理账号设置或重置。修改完成前不能进入任何页面或执行任何操作。')}${field('当前（临时）密码', 'cp-old', '', 'password')}${field('新密码（8–128位，含字母和数字）', 'cp-new', '', 'password')}${field('再次输入新密码', 'cp-new2', '', 'password')}${btn('修改并登录', 'C.confirmChangePassword()', 'primary full')}${btn('返回', 'C.cancelChangePassword()', 'text sm')}</section></div>`; }
    let html = prevLoginView();
    const info = (L.locked ? notice(`界面已锁定（${h(L.locked)}）。采集仍在运行，请重新登录。`) : '');
    return html.includes('<div class="login-fields">') ? html.replace('<div class="login-fields">', info + '<div class="login-fields">') : html + info;
  };

  const prevFirstRun = C.confirmFirstRun;
  C.confirmFirstRun = function () { const n = state.extraUsers.length; const r = prevFirstRun.apply(C, arguments); if (state.extraUsers.length > n) { const u = state.extraUsers[state.extraUsers.length - 1]; u.allDevices = true; u.groups = []; } return r; };

  // ---------- 恢复码：停用账号不可用 ----------
  const prevRecover = C.confirmRecover;
  C.confirmRecover = function () {
    const account = pw('rc-account').trim(), u = findUser(account);
    if (u && lockedUntil(account)) { toast('尝试次数过多，已暂时锁定', 'error'); return {ok:false, reason:'LOCKED'}; }
    if (u?.disabled) { toast('该账号已停用，不能用恢复码重设；请联系管理账号', 'error'); return {ok:false, reason:'DISABLED'}; }
    const a = pw('rc-pw'); const bad = a ? policy(a, account) : null; if (bad) { toast(bad, 'error'); return {ok:false, reason:'POLICY'}; }
    const before = u?.pwdHash; const r = prevRecover.apply(C, arguments);
    if (!r?.ok) { if (u) fail(account); return r; }
    if (u) { u.mustChangePassword = false; u.resetNotice = null; delete L.failures[account]; }
    state.audit.unshift({time: new Date(now()).toLocaleString('zh-CN', {hour12:false}), user: account, owner: account, action: '恢复码重设密码', target: account, result: '已记录'});
    return r;
  };

  // ---------- Windows 管理员兜底重置（恢复码遗失） ----------
  C.osAdminReset = function ({account, elevated = false, isAdministrator = false, cliFlag = false, reason = '', confirm = false} = {}) {
    if (!elevated || !isAdministrator) return {ok:false, reason:'NOT_ELEVATED', message: cliFlag ? '命令行参数不能代替 Windows 管理员提权校验' : '须以 Windows 管理员身份提权运行'};
    const u = findUser(account); if (!u) return {ok:false, reason:'NO_ACCOUNT'};
    if (u.disabled) return {ok:false, reason:'DISABLED', message:'停用账号不能通过兜底重置恢复'};
    if (!reason || !confirm) return {ok:false, reason:'NEED_CONFIRM'};
    if (!state.platform) return {ok:false, reason:'STORE_UNAVAILABLE', message:'本机库不可写，未改动任何数据'};
    const temp = 'Tmp-' + Math.random().toString(36).slice(2, 8) + '7';
    const before = JSON.stringify({role:u.role, scope:u.scope, groups:u.groups, allDevices:!!u.allDevices, disabled:!!u.disabled});
    u.pwdHash = digest(temp); u.mustChangePassword = true; u.resetNotice = '密码已由 Windows 管理员重置，请修改密码';
    state.audit.unshift({time: new Date(now()).toLocaleString('zh-CN', {hour12:false}), user: 'Windows 管理员', owner: 'system', action: 'Windows 管理员兜底重置', target: account, result: '原因：' + reason});
    return {ok:true, temp, unchanged: before === JSON.stringify({role:u.role, scope:u.scope, groups:u.groups, allDevices:!!u.allDevices, disabled:!!u.disabled})};
  };

  // ---------- 账号管理：范围规则 + 授予上限 + 强制改密 + 审计 ----------
  const MANAGED = ['disableUser','enableUser','deleteUser','setUserRole','resetUserPassword','editUser'];
  for (const name of MANAGED) {
    const prev = C[name];
    C[name] = function (account, ...rest) {
      if (!W()) return {ok:false};
      const u = findUser(account); if (!u) return {ok:false, reason:'NO_ACCOUNT'};
      const c = canManage(u); if (!c.ok) return deny(c);
      if (['disableUser','deleteUser','setUserRole'].includes(name) && !(name === 'deleteUser' && account === state.user?.account)) {
        const losing = name !== 'setUserRole' || !MANAGER.has(rest[0]);
        if (isGlobal(u) && losing && users().filter(x => x !== u && isGlobal(x)).length === 0) return deny({reason:'LAST_MANAGER', message:'必须保留至少一个有效的全台账管理账号'});
      }
      const r = prev.call(C, account, ...rest);
      if (name === 'resetUserPassword' && r?.ok) { u.resetNotice = `密码已被 ${state.user?.name || '管理账号'} 重置，请修改密码`; audit('重置密码（须首次改密）', account); }
      return r;
    };
  }
  const prevSaveScope = C.saveUserScope;
  C.saveUserScope = function (account) {
    if (!W()) return {ok:false}; const u = findUser(account); if (!u) return {ok:false};
    const c = canManage(u); if (!c.ok) return deny(c);
    if (u.allDevices) { u.scope = allIds(); u.allDevices = false; }
    const r = prevSaveScope.apply(C, arguments); audit('调整终端授权', account); return r ?? {ok:true};
  };
  C.saveUserGroups = function (account, groups) {
    if (!W()) return {ok:false}; const u = findUser(account); if (!u) return {ok:false, reason:'NO_ACCOUNT'};
    const c = canManage(u); if (!c.ok) return deny(c);
    const want = uniq((groups || []).map(String));
    const g = canGrant({groups: want.filter(x => !(u.groups || []).includes(x))}); if (!g.ok) return deny(g);
    const a = actor(); const keep = isGlobal(a) ? [] : (u.groups || []).filter(x => !(a.groups || []).includes(x));
    mutate('调整分组授权', {name: account}, () => { u.groups = uniq([...keep, ...want]); }, true);
    audit('调整分组授权', account, ''); render(); return {ok:true, groups: [...u.groups]};
  };
  C.setUserAllDevices = function (account, on) {
    if (!W()) return {ok:false}; const u = findUser(account); if (!u) return {ok:false};
    const c = canManage(u); if (!c.ok) return deny(c);
    if (on) { const g = canGrant({allDevices:true}); if (!g.ok) return deny(g); }
    else if (isGlobal(u) && users().filter(x => x !== u && isGlobal(x)).length === 0) return deny({reason:'LAST_MANAGER', message:'必须保留至少一个有效的全台账管理账号'});
    mutate('调整全台账授权', {name: account}, () => { if (!on && u.allDevices) u.scope = allIds(); u.allDevices = !!on; }, true); render(); return {ok:true};
  };
  const prevConfirmAddUser = C.confirmAddUser;
  C.confirmAddUser = function () {
    if (!W()) return {ok:false}; if (!isManager(actor())) return deny({reason:'NOT_MANAGER', message:'当前账号没有账号管理能力'});
    const p = pw('new-user-pw'); const account = pw('new-user-account').trim(); const bad = policy(p, account); if (bad && p === pw('new-user-pw2')) { toast(bad, 'error'); return {ok:false, reason:'POLICY'}; }
    const before = state.extraUsers.length; const r = prevConfirmAddUser.apply(C, arguments);
    if (state.extraUsers.length > before) { const u = state.extraUsers[state.extraUsers.length - 1]; u.groups = []; u.allDevices = false; u.mustChangePassword = true; u.resetNotice = '这是管理账号为你设置的初始密码，请修改'; audit('新增账号（须首次改密）', u.account); }
    return r;
  };
  // 编辑授权弹窗：增加“授权分组（按当前成员）”
  const prevEditUser = C.editUser;
  C.editUser = function (account) {
    const r = prevEditUser.apply(C, arguments); const u = findUser(account); const root = document.getElementById('modal-root');
    if (u && root?.innerHTML) { const a = actor(); const grantable = isGlobal(a) ? uniq(state.devices.map(d => d.project)) : (a?.groups || []);
      root.innerHTML = root.innerHTML.replace('</p>', `</p><h3>授权分组（按分组当前成员生效）</h3>${grantable.map(g => `<label class="target-row"><input type="checkbox" name="scope-group" value="${h(g)}" ${(u.groups || []).includes(g) ? 'checked' : ''}>${h(g)}</label>`).join('') || '<p class="hint">你没有可授予的分组</p>'}<p class="hint">分组授权随分组成员变化；单台授权固定到终端。两者合并为有效范围。</p>`)
        .replace(`C.saveUserScope(${jsArg(account)})`, `C.saveUserGroups(${jsArg(account)},[...document.querySelectorAll('[name=scope-group]:checked')].map(x=>x.value));C.saveUserScope(${jsArg(account)})`); }
    return r;
  };

  // ---------- 迁组 / 登记：目标分组须在操作者授权分组内，不隐式扩大直接授权 ----------
  const manageableGroups = () => { const a = actor(); return isGlobal(a) ? null : (a?.groups || []); };
  const prevMove = C.confirmMoveGroup;
  C.confirmMoveGroup = function () { const g = document.getElementById('move-group')?.value; const mg = manageableGroups(); if (mg && !mg.includes(g)) return deny({reason:'GROUP_OUT_OF_SCOPE', message:'目标分组不在你的授权分组内'}); return prevMove.apply(C, arguments); };
  const prevAddDevice = C.confirmAddDevice;
  C.confirmAddDevice = function () {
    const g = document.getElementById('add-group')?.value; const mg = manageableGroups(); if (mg && !mg.includes(g)) return deny({reason:'GROUP_OUT_OF_SCOPE', message:'目标分组不在你的授权分组内'});
    const before = new Set(allIds()); const r = prevAddDevice.apply(C, arguments); const a = actor();
    if (a && !isGlobal(a)) { const added = allIds().filter(id => !before.has(id)); a.scope = (a.scope || []).filter(id => !added.includes(id)); }
    return r;
  };

  // ---------- 导入：可编辑列对应 + 分组范围校验 ----------
  const TEMPLATE = {file:'本应用导入模板-示例.csv', verified:true, columns:['终端名称','序列号','IP地址','端口','项目分组'], rows:[
    {终端名称:'C 座 1 号梯', 序列号:'HL20260101', IP地址:'192.168.1.81', 端口:'80', 项目分组:'花园中心'},
    {终端名称:'A 座 1 号梯（东侧）', 序列号:'HL20260001', IP地址:'192.168.1.51', 端口:'80', 项目分组:'花园中心'},
    {终端名称:'临时梯', 序列号:'HL20260102', IP地址:'192.168.1.51', 端口:'80', 项目分组:'花园中心'},
    {终端名称:'', 序列号:'', IP地址:'999.1.1.1', 端口:'70000', 项目分组:''},
    {终端名称:'C 座 1 号梯（重复）', 序列号:'HL20260101', IP地址:'192.168.1.82', 端口:'80', 项目分组:'花园中心'},
  ]};
  const DEFAULT_MAP = {name:'终端名称', sn:'序列号', ip:'IP地址', port:'端口', group:'项目分组'};
  const ipOk = ip => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip) && ip.split('.').every(x => Number(x) <= 255);
  function classify(mapping) {
    const seen = new Map(), mg = manageableGroups(), mine = effScope(actor());
    return TEMPLATE.rows.map((raw, i) => {
      const get = k => mapping[k] ? String(raw[mapping[k]] ?? '').trim() : '';
      const r = {line:i + 2, name:get('name'), sn:get('sn'), ip:get('ip'), port:Number(get('port') || 80), group:get('group') || '未分组'};
      if (!mapping.sn || !mapping.ip) return {...r, kind:'invalid', reason:'必填列（序列号/IP地址）未对应'};
      if (!r.sn || !ipOk(r.ip) || !(r.port >= 1 && r.port <= 65535) || !r.name) return {...r, kind:'invalid', reason: !r.sn ? '缺少序列号' : !r.name ? '缺少名称' : !ipOk(r.ip) ? 'IP地址格式错误' : '端口超出范围'};
      if (seen.has(r.sn)) return {...r, kind:'conflict', reason:`与第${seen.get(r.sn)}行序列号重复`}; seen.set(r.sn, r.line);
      const same = state.devices.find(d => d.sn === r.sn), ipUser = state.devices.find(d => d.ip === r.ip && d.sn !== r.sn);
      if (ipUser) return {...r, kind:'conflict', reason: mine.includes(ipUser.id) ? `IP已被 ${ipUser.sn} 使用` : 'IP已被其他终端占用（该终端不在你的范围，不显示明细）'};
      if (mg && !mg.includes(r.group)) return {...r, kind:'conflict', reason:'目标分组不在你的授权分组内'};
      if (same) { if (!mine.includes(same.id)) return {...r, kind:'conflict', reason:'该序列号已登记，不在你的授权范围，不能由你导入或更新'}; const changed = same.name !== r.name || same.ip !== r.ip || Number(same.port || 80) !== r.port || same.project !== r.group; return changed ? {...r, kind:'update', id:same.id, reason:'字段将更新，标为未核验'} : {...r, kind:'unchanged', id:same.id, reason:'无变化'}; }
      return {...r, kind:'new', reason:'新增，标为未核验'};
    });
  }
  const kindName = {new:'新增', update:'更新', conflict:'冲突（不导入）', invalid:'无效（不导入）', unchanged:'无变化'};
  function importModal() {
    const p = L.importPreview, count = k => p.rows.filter(r => r.kind === k).length;
    const sel = k => `<select onchange="C.setImportMapping('${k}',this.value)"><option value="">（不导入）</option>${TEMPLATE.columns.map(c => `<option ${p.mapping[k] === c ? 'selected' : ''}>${h(c)}</option>`).join('')}</select>`;
    modal('导入台账', `<p>文件：${h(TEMPLATE.file)}（本应用导入模板，已验证样例）。旧平台导出表头尚未取得真实样例，不自动套用旧字段名，请手动选择列对应。</p><h3>列对应（可修改）</h3><table class="table"><tbody>${Object.entries({name:'终端名称', sn:'序列号（必填）', ip:'IP地址（必填）', port:'端口', group:'项目分组'}).map(([k, n]) => `<tr><td>${n}</td><td>${sel(k)}</td></tr>`).join('')}</tbody></table><h3>预览</h3><p>新增 ${count('new')} · 更新 ${count('update')} · 冲突 ${count('conflict')} · 无效 ${count('invalid')}</p><table class="table"><thead><tr><th>行</th><th>名称</th><th>序列号</th><th>IP</th><th>分组</th><th>结果</th><th>原因</th></tr></thead><tbody>${p.rows.map(r => `<tr data-kind="${r.kind}"><td>${r.line}</td><td>${h(r.name)}</td><td>${h(r.sn)}</td><td>${h(r.ip)}</td><td>${h(r.group)}</td><td>${kindName[r.kind]}</td><td>${h(r.reason)}</td></tr>`).join('')}</tbody></table><p class="hint">只写入本机台账，不连接设备。导入的终端为“未核验”。新终端进入所选分组，不会加入你的单台授权。</p>`, btn('取消', 'C.closeModal()') + btn('确认导入', 'C.confirmImportDemo()', 'primary'), true);
  }
  C.openImportDemo = function () { L.importPreview = null; if (!W()) return; if (!isManager(actor())) return deny({reason:'NOT_MANAGER', message:'当前账号不能导入台账'}); const mapping = {...DEFAULT_MAP}; L.importPreview = {file:TEMPLATE.file, mapping, rows:classify(mapping), epoch:state.sessionEpoch, account:state.user.account}; importModal(); return L.importPreview; };
  C.setImportMapping = function (field, column) { const p = L.importPreview; if (!p || p.account !== state.user?.account) return {ok:false}; if (!(field in DEFAULT_MAP)) return {ok:false}; p.mapping[field] = column && TEMPLATE.columns.includes(column) ? column : ''; p.rows = classify(p.mapping); importModal(); return {ok:true}; };
  C.confirmImportDemo = function () {
    const p = L.importPreview;
    if (!p || p.epoch !== state.sessionEpoch || p.account !== state.user?.account) { toast('预览已失效，请重新选择文件', 'error'); return {ok:false, reason:'STALE'}; }
    if (!W()) return {ok:false};
    const rows = classify(p.mapping); // 提交时按当前数据与权限重新校验
    const res = {added:0, updated:0, skipped: rows.filter(r => !['new','update'].includes(r.kind)).length, rechecked: rows.some((r, i) => r.kind !== p.rows[i]?.kind)};
    mutate('导入台账', {name:p.file}, () => { let id = Math.max(0, ...allIds()); for (const r of rows) {
      if (r.kind === 'new') { state.devices.push({...initialDevices()[0], id:++id, name:r.name, sn:r.sn, ip:r.ip, port:r.port, project:r.group, location:'待完善', online:'unknown', comm:'unknown', sleep:'unknown', version:'未知', hardware:null, activated:false, verified:false, sampledAt:null}); res.added++; }
      else if (r.kind === 'update') { const d = state.devices.find(x => x.id === r.id); Object.assign(d, {name:r.name, ip:r.ip, port:r.port, project:r.group, verified:false}); res.updated++; } } }, true);
    L.importPreview = null; L.importResult = res; modal('导入结果', `<p>新增 ${res.added} 台 · 更新 ${res.updated} 台 · 跳过 ${res.skipped} 行。</p>${res.rechecked ? notice('提交时数据或权限已变化，已按最新结果导入。', 'amber') : ''}<p class="hint">新增与更新的终端显示为“未核验”。</p>`, btn('完成', 'C.closeModal()', 'primary')); render(); return {ok:true, ...res};
  };

  // ---------- 备份/恢复：全局能力 + 每任务安全检查点 + 回滚点 ----------
  for (const b of L.backups) b.counts = b.counts || {accounts:3, groups:3, devices:8, tasks:2, audit:12, packages:2};
  const UNSAFE_STATUS = new Set(['running','pending_external','queued','pausing','needs_verification']);
  const taskSafety = t => { if (!UNSAFE_STATUS.has(t.status) && !t.pauseRequested) return {safe:true};
    if (t.status === 'paused' && t.checkpointAt) return {safe:true};
    if ((t.results || []).some(r => r.state === 'uncertain' || (r.sent && r.state === 'running'))) return {safe:false, why:'已发出写请求待核验'};
    return {safe:false, why: t.pauseRequested ? '已请求暂停，尚未到达检查点' : '执行中'}; };
  const unsafeTasks = () => state.tasks.map(t => ({t, s: taskSafety(t)})).filter(x => !x.s.safe);
  const prevOpenBackup = C.openBackupDemo; C.openBackupDemo = function () { if (!WG()) return; return prevOpenBackup.apply(C, arguments); };
  const prevCreateBackup = C.createBackup;
  C.createBackup = function () { if (!WG()) return {ok:false}; const r = prevCreateBackup.apply(C, arguments); if (r?.ok) r.backup.counts = {accounts: users().length, groups: uniq(state.devices.map(d => d.project)).length, devices: state.devices.length, tasks: state.tasks.length, audit: state.audit.length, packages: L.packages.length}; return r; };
  const prevPreview = C.previewRestore;
  C.previewRestore = function (id) {
    if (!WG()) return {ok:false};
    const r = prevPreview.apply(C, arguments); if (!r?.ok) return r;
    const b = L.backups.find(x => x.id === id), cur = {accounts: users().length, groups: uniq(state.devices.map(d => d.project)).length, devices: state.devices.length, tasks: state.tasks.length, audit: state.audit.length, packages: L.packages.length};
    const names = {accounts:'账号', groups:'分组', devices:'终端', tasks:'任务', audit:'操作记录', packages:'软件包索引'};
    const ut = unsafeTasks();
    modal('恢复预览', `<p>备份：${h(b.name)}（${h(b.time)}）。将覆盖：${b.contents.map(h).join('、')}。</p><table class="table"><thead><tr><th>数据</th><th>备份中</th><th>当前</th></tr></thead><tbody>${Object.keys(names).map(k => `<tr><td>${names[k]}</td><td>${b.counts?.[k] ?? '—'}</td><td>${cur[k]}</td></tr>`).join('')}</tbody></table>${notice('账号、密码与授权将回滚到备份时间：之后新建或改过密码的账号会丢失或恢复为旧密码。恢复前会自动为当前数据创建回滚点。', 'amber')}${ut.length ? notice(`有 ${ut.length} 个任务未到安全检查点：${ut.map(x => h(x.t.id) + '（' + x.s.why + '）').join('、')}。需先暂停并等待到达检查点；已发出写请求的任务须先核验。`, 'red') + btn('请求暂停执行中任务', 'C.pauseForRestore()') : ''}<label class="target-row"><input id="rs-fail" type="checkbox" ${L.restoreFail ? 'checked' : ''} onchange="state.local15.restoreFail=this.checked">模拟恢复失败（审阅）</label><p class="hint">恢复成功后所有人须重新登录；采集引擎先只读核验，不重放任何设备写操作。</p>`, btn('取消', 'C.closeModal()') + btn('确认恢复', 'C.confirmRestore()', 'danger'));
    return {...r, preview:{backup:b.counts, current:cur}, unsafeTasks: ut.map(x => x.t.id)};
  };
  C.pauseForRestore = function () {
    if (!WG()) return {ok:false};
    const list = state.tasks.filter(t => UNSAFE_STATUS.has(t.status));
    for (const t of list) { t.pauseRequested = true; if (t.status === 'running' || t.status === 'queued') t.status = 'pausing';
      setTimeout(() => { if (!t.pauseRequested) return; const sentPending = (t.results || []).some(r => r.state === 'uncertain' || (r.sent && r.state === 'running'));
        if (sentPending) t.status = 'needs_verification'; else if (t.status === 'pausing') { t.status = 'paused'; t.checkpointAt = new Date(now()).toISOString(); } render(); }, 0); }
    toast('已请求暂停：每个任务在当前步骤结束处停下；已发出的设备请求不会被中断'); return {ok:true, requested: list.map(t => t.id)};
  };
  const prevConfirmRestore = C.confirmRestore;
  C.confirmRestore = function () {
    const p = L.restorePreview; if (!p || p.epoch !== state.sessionEpoch || p.account !== state.user?.account) { toast('预览已失效，请重新检查备份', 'error'); return {ok:false, reason:'STALE'}; }
    if (!WG()) return {ok:false};
    const ut = unsafeTasks(); if (ut.length) { toast('仍有任务未到安全检查点：' + ut.map(x => x.t.id).join('、'), 'error'); return {ok:false, reason:'ACTIVE_TASKS', detail:'NOT_AT_CHECKPOINT', tasks: ut.map(x => x.t.id)}; }
    const rollback = {id:'b-rollback-' + (L.backups.length + 1), name:'恢复前自动备份（回滚点）.ysbak', version:'1.5', checksum:'ok', time:new Date(now()).toLocaleString('zh-CN', {hour12:false}), contents:['台账与分组','账号与授权','任务与审计'], counts:{accounts: users().length, devices: state.devices.length}};
    L.backups.unshift(rollback); L.lastRollback = rollback; L.paused = true;
    audit('恢复前创建回滚点', rollback.name);
    return prevConfirmRestore.apply(C, arguments);
  };

  // ---------- 自动备份配置 ----------
  L.autoBackup = L.autoBackup || {enabled:true, time:'02:00', keep:14, dest:'%ProgramData%\\Yeeshine\\TerminalManager\\backups', encrypted:true, passphraseSet:true, lastResult:null, consecutiveFailures:0, destAvailable:true, freeSpaceOk:true};
  C.saveAutoBackup = function (cfg = {}) {
    if (!WG()) return {ok:false};
    const keep = Number(cfg.keep ?? L.autoBackup.keep); if (!(keep >= 1 && keep <= 365)) return deny({reason:'BAD_KEEP', message:'保留份数须为1–365'});
    const encrypted = cfg.encrypted ?? L.autoBackup.encrypted, passphraseSet = cfg.passphraseSet ?? L.autoBackup.passphraseSet;
    if (encrypted && !passphraseSet) return deny({reason:'NO_PASSPHRASE', message:'加密备份需要先设置备份口令（口令遗失则无法恢复）'});
    Object.assign(L.autoBackup, {keep, encrypted, passphraseSet, enabled: cfg.enabled ?? L.autoBackup.enabled, time: cfg.time ?? L.autoBackup.time, dest: cfg.dest ?? L.autoBackup.dest});
    audit('修改自动备份设置', '自动备份'); return {ok:true};
  };
  C.runAutoBackup = function () {
    const a = L.autoBackup, before = L.backups.length;
    if (!a.destAvailable) { a.consecutiveFailures++; a.lastResult = '失败：备份位置不可用'; return {ok:false, reason:'DEST_UNAVAILABLE', kept: L.backups.length === before}; }
    if (!a.freeSpaceOk) { a.consecutiveFailures++; a.lastResult = '失败：空间不足'; return {ok:false, reason:'NO_SPACE', kept: L.backups.length === before}; }
    const b = {id:'b-auto-' + (before + 1), name:'自动备份.ysbak', version:'1.5', checksum:'ok', encrypted:a.encrypted, time:new Date(now()).toLocaleString('zh-CN', {hour12:false}), contents:['台账与分组','账号与授权','任务与审计'], counts:{accounts: users().length, devices: state.devices.length}};
    L.backups.unshift(b); const autos = L.backups.filter(x => x.id.startsWith('b-auto-')); for (const x of autos.slice(a.keep)) L.backups.splice(L.backups.indexOf(x), 1);
    a.consecutiveFailures = 0; a.lastResult = '成功'; return {ok:true, backup:b};
  };

  // ---------- 受控数据迁移（替代随意切换目录） ----------
  const S_ = state.support; S_.platformAddress = '%ProgramData%\\Yeeshine\\TerminalManager';
  const prevSaveConn = C.saveConnection;
  C.saveConnection = function () { if (!WG()) return {ok:false}; return prevSaveConn.apply(C, arguments); };

  // ---------- 兼容索引：版本、撤销、来源标记 ----------
  L.compatIndex = L.compatIndex || {version:1, source:'本机验收登记（未经厂商签名；厂商签发能力待核实）', revoked:[]};
  C.applyCompatIndex = function (idx = {}) {
    if (!WG()) return {ok:false};
    if (!(Number(idx.version) > L.compatIndex.version)) return deny({reason:'STALE_INDEX', message:'索引版本不高于当前版本，已拒绝（防回退）'});
    if (idx.signature === 'invalid') return deny({reason:'BAD_SIGNATURE', message:'索引签名验证失败，整份拒绝'});
    L.compatIndex = {version:Number(idx.version), source: idx.signature === 'valid' ? '厂商签名清单（签发能力待核实）' : '本机验收登记（未经厂商签名）', revoked: uniq([...(L.compatIndex.revoked || []), ...(idx.revoke || [])])};
    for (const p of L.packages) if (L.compatIndex.revoked.includes(p.version)) p.status = 'revoked';
    audit('导入兼容索引 v' + idx.version, '软件包库'); render(); return {ok:true};
  };
  const prevImportPkg = C.confirmImportPackage;
  C.confirmImportPackage = function () { if (!WG()) return {ok:false}; return prevImportPkg.apply(C, arguments); };

  // ---------- 账号页：分组授权列与审阅入口 ----------
  const prevAdmin = admin;
  admin = function () { let html = prevAdmin(); if (!state.user || readOnly() || state.adminTab !== 'users') return html;
    const rows = users().map(u => `<tr><td>${h(u.account)}</td><td>${u.allDevices ? '全台账' : (u.groups || []).map(h).join('、') || '—'}</td><td>${(u.scope || []).length && !u.allDevices ? (u.scope || []).length + ' 台' : '—'}</td><td>${effScope(u).length} 台</td><td>${canManage(u).ok ? '可管理' : '超出你的范围'}</td></tr>`).join('');
    return html + `<section class="card"><h2>授权构成</h2><p class="hint">有效范围 = 全台账，或 授权分组当前成员 ∪ 单台授权。管理员与维护为管理账号，授权范围固定为全台账；分组/单台范围只适用于只读账号（不含子分组）。受范围限制的账号只读，不能管理任何账号。</p><table class="table"><thead><tr><th>账号</th><th>授权分组</th><th>单台授权</th><th>有效范围</th><th>你的权限</th></tr></thead><tbody>${rows}</tbody></table></section>`; };
  C.reviewSeedLimitedMaint = function () { if (findUser('zhao')) return findUser('zhao'); const u = {name:'赵工（受限）', account:'zhao', role:'maint', initial:'赵', scope:[], groups:['滨江雅苑'], allDevices:false}; state.extraUsers.push(u); render(); return u; };

  const prevDiag = C.diagnostics; C.diagnostics = function () { const r = prevDiag.apply(C, arguments); const root = document.getElementById('modal-root'); if (root?.innerHTML) root.innerHTML = root.innerHTML.replace('</p>', `</p><p class="hint">采集器：${L.collector.running ? '运行中' : '已停止'} · ${isGlobal(actor()) ? `覆盖本机全台账 ${state.devices.length} 台（仅显示数量）` : `覆盖本机全台账（总数仅全台账管理账号可见）；你可查看 ${visibleDevices().length} 台`} · 登出或锁定不停止。</p>`); return r; };

  window.prototypeLocal15r3 = {effScope, canManage, canGrant, isGlobal, isManager, attachScope, audit, policy, classify: () => classify(L.importPreview?.mapping || DEFAULT_MAP), taskSafety};
  if (state.user) attachScope(findUser(state.user.account));
  render();
})();
