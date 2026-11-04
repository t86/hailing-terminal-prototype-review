'use strict';
// V1.5-r4 可审阅 fixture：会话有效范围随授权/分组成员/角色实时重算；授权原子保存；
// 范围外信息不泄露（账号页按可管理范围过滤、采集数量口径分离）。
// 只改内存演示状态：不连接业务后台、不读写真实数据库、不向设备发送任何请求。
(() => {
  const X = window.prototypeLocal15r3, L = state.local15;
  const users = () => [...Object.values(accounts), ...state.extraUsers];
  const findUser = a => users().find(u => u.account === a);
  const actor = () => state.user ? findUser(state.user.account) : null;
  const uniq = a => [...new Set(a)];
  const deny = r => { toast(r.message, 'error'); return {ok:false, reason:r.reason}; };

  // ---------- 1. 会话有效范围重算 ----------
  // 会话不缓存授权：每次渲染、每个采集周期、每次授权保存后，按账号当前角色、分组当前成员与单台授权重算。
  // 范围缩小时：移除已选、清除指向范围外终端的待确认计划、关闭打开的对话框、离开范围外终端详情。
  // 进行中的任务由任务引擎在每个写步骤前重新授权（authorizeWrite），范围外目标不再发送写请求。
  const resync = () => { if (state.user) X.attachScope(findUser(state.user.account)); };
  let watching = false;
  function scopeWatch() {
    if (watching) return {changed:false};
    if (!state.user) { L.sessionScope = null; return {changed:false}; }
    watching = true;
    try {
      const a = actor();
      if (!a || a.disabled) { const msg = a ? '账号已被停用，会话已结束' : '账号已不存在，会话已结束'; C.logout(); state.loginError = msg; return {changed:true, ended:true}; }
      if (state.user.role !== a.role) state.user.role = a.role;
      const ids = visibleDevices().map(d => d.id);
      const prev = L.sessionScope && L.sessionScope.account === a.account ? L.sessionScope.ids : null;
      L.sessionScope = {account:a.account, ids};
      const removed = prev ? prev.filter(id => !ids.includes(id)) : [];
      if (!removed.length) return {changed:false};
      for (const id of removed) state.selected.delete(id);
      for (const k of ['pendingNetwork', 'pendingParams']) if (state[k] && removed.includes(state[k].id)) state[k] = null;
      if (state.upgradePlan && (state.upgradePlan.snapshots || []).some(s => removed.includes(s.id))) state.upgradePlan = null;
      if (state.pendingExternalRegister && removed.includes(state.pendingExternalRegister.deviceId)) state.pendingExternalRegister = null;
      if (removed.includes(state.detailId) || state.page === 'detail' && !ids.includes(state.detailId)) { state.detailId = null; if (state.page === 'detail') state.page = 'devices'; }
      closeModal();
      L.scopeNotice = `你的授权范围已变化：${removed.length} 台终端已不在你的范围，相关页面与未完成操作已关闭。`;
      toast(L.scopeNotice, 'error');
      return {changed:true, removed:removed.length};
    } finally { watching = false; }
  }
  C.scopeWatch = scopeWatch;
  const prevRender = render;
  render = function () { scopeWatch(); return prevRender.apply(this, arguments); };
  const prevTick = C.collectorTick;
  C.collectorTick = function () { const r = prevTick.apply(C, arguments); if (scopeWatch().changed && state.user) render(); return r; };

  // 保存自己的授权后：会话回到“实时计算”，分组成员立即生效（不再只保留直接授权）
  for (const name of ['saveUserScope', 'saveUserGroups', 'setUserAllDevices', 'setUserRole']) {
    const prev = C[name];
    C[name] = function (account, ...rest) { const r = prev.call(C, account, ...rest); if (state.user && account === state.user.account) { resync(); render(); } return r; };
  }

  // 原子保存：分组 + 单台授权一次校验、一次写入；任何一项越权则整体拒绝，不留半更新
  C.saveUserGrant = function (account, groups, devices) {
    if (!window.prototypeSupport.guard(true, null, true)) return {ok:false};
    if (!state.platform) return deny({reason:'STORE_UNAVAILABLE', message:'本机台账库不可用，不能改写本机数据'});
    const u = findUser(account); if (!u) return {ok:false, reason:'NO_ACCOUNT'};
    const c = X.canManage(u); if (!c.ok) return deny(c);
    const a = actor(), mine = X.effScope(a), global = X.isGlobal(a);
    const wantGroups = uniq((groups || []).map(String)), wantDevices = uniq((devices || []).map(Number));
    const g = X.canGrant({groups: wantGroups.filter(x => !(u.groups || []).includes(x)), devices: wantDevices.filter(id => !(u.scope || []).includes(id))});
    if (!g.ok) return deny(g);
    const keepGroups = global ? [] : (u.groups || []).filter(x => !(a.groups || []).includes(x));
    const keepDevices = global ? [] : (u.scope || []).filter(id => !mine.includes(id));
    const before = JSON.stringify({g:u.groups, s:u.scope});
    const res = mutate('调整授权（分组与单台）', {name:account}, () => {
      if (u.allDevices) u.allDevices = false;
      u.groups = uniq([...keepGroups, ...wantGroups]);
      u.scope = uniq([...keepDevices, ...wantDevices.filter(id => global || mine.includes(id))]);
    }, true);
    if (!res.ok) return {ok:false, reason:'SAVE_FAILED'};
    X.audit('调整授权（分组与单台）', account);
    closeModal();
    if (state.user && account === state.user.account) resync();
    render();
    return {ok:true, changed: before !== JSON.stringify({g:u.groups, s:u.scope}), groups:[...u.groups], scope:[...u.scope]};
  };
  const prevEditUser = C.editUser;
  C.editUser = function (account) {
    const r = prevEditUser.apply(C, arguments); const root = document.getElementById('modal-root');
    if (root?.innerHTML) root.innerHTML = root.innerHTML.replace(
      `C.saveUserGroups(${jsArg(account)},[...document.querySelectorAll('[name=scope-group]:checked')].map(x=>x.value));C.saveUserScope(${jsArg(account)})`,
      `C.saveUserGrant(${jsArg(account)},[...document.querySelectorAll('[name=scope-group]:checked')].map(x=>x.value),[...document.querySelectorAll('[name=scope-device]:checked')].map(x=>Number(x.value)))`);
    return r;
  };

  // ---------- 2. 账号页按可管理范围过滤：受限管理账号看不到范围更大的账号 ----------
  function withVisibleAccounts(fn) {
    const a = actor(); if (!a || X.isGlobal(a)) return fn();
    const hidden = new Set(users().filter(u => u.account !== a.account && !X.canManage(u).ok).map(u => u.account));
    if (!hidden.size) return fn();
    const order = Object.entries(accounts), extra = state.extraUsers;
    for (const [k, u] of order) if (hidden.has(u.account)) delete accounts[k];
    state.extraUsers = extra.filter(u => !hidden.has(u.account));
    try { return fn(); } finally {
      for (const k of Object.keys(accounts)) delete accounts[k];
      for (const [k, u] of order) accounts[k] = u;
      state.extraUsers = extra;
    }
  }
  const prevAdmin = admin;
  admin = function () { const html = withVisibleAccounts(() => prevAdmin.apply(this, arguments));
    const a = actor(); if (!a || X.isGlobal(a) || state.adminTab !== 'users' || readOnly()) return html;
    return html + `<p class="hint">只显示你可以管理的账号（范围不超过你的授权）。范围更大的账号不显示名称、账号或授权构成。</p>`; };

  // ---------- 3. 采集数量口径：采集范围是全台账；界面数量按当前账号可见范围 ----------
  const prevSettings = settings;
  settings = function () { const html = prevSettings.apply(this, arguments); const a = actor();
    return a && X.isGlobal(a) ? html.replace('<div class="kv"><label>你可查看的终端</label>', kv('全台账终端', state.devices.length + ' 台') + '<div class="kv"><label>你可查看的终端</label>') : html; };

  window.prototypeLocal15r4 = {scopeWatch, withVisibleAccounts};
  render();
})();
