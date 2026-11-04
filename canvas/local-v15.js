'use strict';
// V1.5 单机自包含：本机账号 / 台账导入导出 / 备份恢复 / 本机软件包库 的可审阅 fixture。
// 只改内存中的演示状态：不连接业务后台、不读写真实数据库、不向设备发送任何请求。
(() => {
  const G = window.prototypeSupport.guard;
  // 本机库写入：需已登录、非只读，且本机台账库可用（不要求采集引擎运行）
  const W=()=>{if(!G(true,null,true))return false;if(!state.platform){toast('本机台账库不可用，不能改写本机数据','error');return false;}return true;};
  const L = state.local15 = {
    recovery:{liming:{hash:null,used:false}}, // 预置管理员的演示恢复码，见 recoverPassword 弹窗审阅提示
    backups:[
      {id:'b-ok',name:'台账备份-20261026.ysbak',version:'1.5',checksum:'ok',time:'2026/10/26 18:00',contents:['台账与分组','账号与授权','任务与审计']},
      {id:'b-bad',name:'损坏的备份-20261020.ysbak',version:'1.5',checksum:'mismatch',time:'2026/10/20 09:12',contents:['台账与分组','账号与授权']},
      {id:'b-new',name:'更高版本备份-v2.0.ysbak',version:'2.0',checksum:'ok',time:'2026/10/25 10:30',contents:['台账与分组','账号与授权']},
    ],
    restorePreview:null, restoreFail:false, paused:false, postRestore:false, verifyReadOnly:false,
    importPreview:null, lastExport:'', lastBackup:null,
    packages:[
      {version:'V6.0.13',file:'ys-mt6-v6.0.13.pkg',sha256:'9f2c5a1e…c41d（fixture）',hardware:['YS-MT6 / H2.1'],minVersion:'V6.0.10',status:'known',size:'36.2 MB'},
      {version:'V6.0.12',file:'ys-mt6-v6.0.12.pkg',sha256:'51ab07d3…77e0（fixture）',hardware:['YS-MT6 / H2.1'],minVersion:'V6.0.10',status:'known',size:'35.9 MB'},
    ],
  };
  const DEMO_RECOVERY='YS-RC-4K7Q-9M2P';
  const digest=s=>{let x=2166136261;for(const c of String(s)){x^=c.codePointAt(0);x=Math.imul(x,16777619)>>>0;}return 'fnv:'+x.toString(16);}; // 演示用，正式实现为 Argon2id/scrypt
  L.recovery.liming.hash=digest(DEMO_RECOVERY);
  const MANAGER=new Set(['admin','maint']);
  const users=()=>[...Object.values(accounts),...state.extraUsers];
  const findUser=a=>users().find(u=>u.account===a);
  const activeManagers=(except=null)=>users().filter(u=>u!==except&&!u.disabled&&MANAGER.has(u.role));
  function lastManagerBlock(u,next){ // next: {role?,disabled?,deleted?}
    if(!u||!MANAGER.has(u.role)||u.disabled)return null;
    const losing=next.deleted||next.disabled||(next.role&&!MANAGER.has(next.role));
    if(losing&&activeManagers(u).length===0)return '必须保留至少一个有效的管理账号，不能停用、删除或降级最后一个管理账号';
    return null;
  }
  const genCode=()=>'YS-RC-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const pw=id=>document.getElementById(id)?.value||'';
  const pwOk=(a,b)=>a.length>=8&&a===b;

  /* ---------- 首次启动 / 登录 / 恢复码 ---------- */
  const baseLogin=login;
  login=function(){
    if(!users().length)return `<div class="login-page"><section class="card login-card"><h1>首次使用：创建管理员</h1>${notice('本机还没有账号。请创建第一个管理员；创建后会显示一次性恢复码。此在线原型仅作演示，账号和恢复码只保存在当前页面内，刷新后会重置，请勿使用真实密码。')}${field('姓名','fr-name','')}${field('账号','fr-account','')}${field('密码（至少8位）','fr-pw','','password')}${field('再次输入密码','fr-pw2','','password')}${btn('创建管理员','C.confirmFirstRun()','primary full')}</section></div>`;
    let html=accounts[state.reviewRole]?baseLogin():`<div class="login-page"><section class="card login-card"><h1>本机登录</h1><form onsubmit="event.preventDefault();C.login()"><div class="login-fields">${field('账号','login-account','')}${field('密码','login-password','','password')}${btn('登录','C.login()','primary full')}${state.loginError?notice(h(state.loginError),'red'):''}</div></form></section></div>`;
    const extra=(L.postRestore?notice('已从备份恢复。请重新登录；登录后采集引擎先只读核验设备，不重放任何设备写操作。','amber'):'')+`<div class="login-recovery">${btn('忘记密码？使用恢复码','C.recoverPassword()','text sm')}</div>`;
    return html.includes('<div class="login-fields">')?html.replace('<div class="login-fields">',extra+'<div class="login-fields">'):html+extra;
  };
  C.simulateFreshInstall=function(){if(state.user)return toast('请先退出登录','error');for(const k of Object.keys(accounts))delete accounts[k];state.extraUsers.length=0;L.recovery={};render();};
  C.confirmFirstRun=function(){
    if(users().length){toast('本机已有账号，首次创建入口已关闭','error');return;}
    const name=pw('fr-name').trim(),account=pw('fr-account').trim(),a=pw('fr-pw'),b=pw('fr-pw2');
    if(!name||!account||/[<>"'\s]/.test(account)){toast('请填写姓名与合法账号','error');return;}
    if(!pwOk(a,b)){toast('密码至少8位且两次一致','error');return;}
    const code=genCode();
    state.extraUsers.push({name,account,role:'admin',scope:state.devices.map(d=>d.id),initial:name[0],pwdHash:digest(a)});
    L.recovery[account]={hash:digest(code),used:false};L.shownCode=code;
    render();
    modal('请保存恢复码',`<p>恢复码只显示这一次，可用于重设密码。此原型仅在当前页面中模拟保存，刷新后会重置。</p><p class="recovery-code"><strong>${h(code)}</strong></p>`,btn('我已保存','C.closeModal()','primary'));
  };
  const baseLoginFn=C.login;
  C.login=function(){const name=pw('login-account').trim(),p=pw('login-password');const u=findUser(name);
    if(u?.disabled){state.loginError='该账号已停用';render();return;}
    if(u?.pwdHash&&digest(p)!==u.pwdHash){state.loginError='账号或密码不匹配';render();return;}
    return baseLoginFn.apply(C,arguments);};
  const baseLoginAs=C.loginAs;
  C.loginAs=function(role,account=null){const u=account?findUser(account):accounts[role];if(u?.disabled){state.loginError='该账号已停用';render();return;}
    const r=baseLoginAs.apply(C,arguments);
    if(state.user&&L.postRestore){L.postRestore=false;L.verifyReadOnly=true;state.devices.forEach(d=>{d.sampledAt=null;});toast('已恢复：采集引擎正在只读核验设备状态，不重放写操作','success');}
    return r;};
  C.recoverPassword=function(){if(state.user)return toast('请先退出登录','error');modal('使用恢复码重设密码',`${field('账号','rc-account','')}${field('恢复码','rc-code','')}${field('新密码（至少8位）','rc-pw','','password')}${field('再次输入新密码','rc-pw2','','password')}<p class="hint">恢复码只能使用一次，使用后请登录并生成新的恢复码。</p>`,btn('取消','C.closeModal()')+btn('重设密码','C.confirmRecover()','primary'));};
  C.confirmRecover=function(){const account=pw('rc-account').trim(),code=pw('rc-code').trim(),a=pw('rc-pw'),b=pw('rc-pw2');const u=findUser(account),rec=L.recovery[account];
    if(!u||!rec||rec.used||digest(code)!==rec.hash){toast('恢复码无效或已使用','error');return {ok:false};}
    if(!pwOk(a,b)){toast('新密码至少8位且两次一致','error');return {ok:false};}
    if(u.disabled){toast('该账号已停用，不能用恢复码重设','error');return {ok:false,reason:'DISABLED'};}u.pwdHash=digest(a);rec.used=true;closeModal();toast('密码已重设，恢复码已失效；请登录后生成新的恢复码','success');render();return {ok:true};};
  C.regenerateRecovery=function(){if(!W())return;const code=genCode();L.recovery[state.user.account]={hash:digest(code),used:false};modal('新的恢复码',`<p>旧恢复码已失效。新恢复码只显示这一次：</p><p class="recovery-code"><strong>${h(code)}</strong></p>`,btn('我已保存','C.closeModal()','primary'));return code;};

  /* ---------- 账号管理：初始密码 / 停用 / 删除 / 降级 / 重设密码 ---------- */
  const baseAddUser=C.addUser;
  C.addUser=function(){const r=baseAddUser.apply(C,arguments);const root=document.getElementById('modal-root');if(root?.innerHTML&&root.innerHTML.includes('new-user-name'))root.innerHTML=root.innerHTML.replace('<h3>单台终端授权</h3>',`<div class="form-grid">${field('初始密码（至少8位）','new-user-pw','','password')}${field('再次输入','new-user-pw2','','password')}</div><p class="hint">首次登录须修改初始密码。</p><h3>单台终端授权</h3>`);return r;};
  const baseConfirmAddUser=C.confirmAddUser;
  C.confirmAddUser=function(){if(!W())return;const a=pw('new-user-pw'),b=pw('new-user-pw2');if(!pwOk(a,b)){toast('初始密码至少8位且两次一致','error');return;}const before=state.extraUsers.length;const r=baseConfirmAddUser.apply(C,arguments);if(state.extraUsers.length>before){const u=state.extraUsers[state.extraUsers.length-1];u.pwdHash=digest(a);u.mustChangePassword=true;}return r;};
  function manageCheck(account){if(!W())return null;const u=findUser(account);if(!u){toast('账号不存在','error');return null;}return u;}
  C.disableUser=function(account){const u=manageCheck(account);if(!u)return {ok:false};const block=lastManagerBlock(u,{disabled:true});if(block){toast(block,'error');return {ok:false,reason:'LAST_MANAGER'};}
    mutate('停用账号',{name:account},()=>{u.disabled=true;},true);if(state.user?.account===account)C.logout();else render();return {ok:true};};
  C.enableUser=function(account){const u=manageCheck(account);if(!u)return {ok:false};mutate('启用账号',{name:account},()=>{u.disabled=false;},true);render();return {ok:true};};
  C.deleteUser=function(account){const u=manageCheck(account);if(!u)return {ok:false};if(state.user.account===account){toast('不能删除当前登录账号','error');return {ok:false,reason:'SELF'};}const block=lastManagerBlock(u,{deleted:true});if(block){toast(block,'error');return {ok:false,reason:'LAST_MANAGER'};}
    mutate('删除账号',{name:account},()=>{const k=Object.keys(accounts).find(k=>accounts[k]===u);if(k)delete accounts[k];else state.extraUsers.splice(state.extraUsers.indexOf(u),1);delete L.recovery[account];},true);render();return {ok:true};};
  C.setUserRole=function(account,role){const u=manageCheck(account);if(!u||!roleNames[role])return {ok:false};const block=lastManagerBlock(u,{role});if(block){toast(block,'error');return {ok:false,reason:'LAST_MANAGER'};}
    mutate('调整角色',{name:account},()=>{u.role=role;},true);if(state.user?.account===account){state.user.role=role;}render();return {ok:true};};
  C.resetUserPassword=function(account){const u=manageCheck(account);if(!u)return {ok:false};const temp='Tmp-'+Math.random().toString(36).slice(2,8);mutate('重设密码',{name:account},()=>{u.pwdHash=digest(temp);u.mustChangePassword=true;},true);modal('临时密码',`<p>账号 ${h(account)} 的临时密码（只显示一次，首次登录须修改）：</p><p class="recovery-code"><strong>${h(temp)}</strong></p>`,btn('关闭','C.closeModal()','primary'));return {ok:true,temp};};
  const baseAdmin=admin;
  admin=function(){const html=baseAdmin();if(!state.user||readOnly()||state.adminTab==='groups'||state.adminTab==='permissions')return html;
    const rows=users().map(u=>`<tr><td>${h(u.name)}<small>${h(u.account)}</small></td><td>${h(roleNames[u.role])}</td><td>${u.disabled?'已停用':'有效'}</td><td>${u.disabled?btn('启用',`C.enableUser(${jsArg(u.account)})`,'text sm'):btn('停用',`C.disableUser(${jsArg(u.account)})`,'text sm')}${btn('重设密码',`C.resetUserPassword(${jsArg(u.account)})`,'text sm')}${u.role!=='viewer'?btn('改为只读',`C.setUserRole(${jsArg(u.account)},'viewer')`,'text sm'):btn('改为维护',`C.setUserRole(${jsArg(u.account)},'maint')`,'text sm')}${btn('删除',`C.deleteUser(${jsArg(u.account)})`,'text sm')}</td></tr>`).join('');
    return html+`<section class="card"><h2>账号状态与保护</h2><p class="hint">管理员与维护首期同权（含账号管理），均为全台账。必须始终保留至少一个启用的管理账号；只读账号的分组授权按分组当前成员生效，单台授权固定到该终端，两者取并集。</p><table class="table"><thead><tr><th>姓名 / 账号</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>${btn('生成新的恢复码（当前账号）','C.regenerateRecovery()')}</section>`;};

  /* ---------- 台账导入 / 导出 ---------- */
  const IMPORT_FIXTURE={file:'台账导入示例.csv',columns:['终端名称','序列号','IP地址','端口','项目分组'],mapping:{name:'终端名称',sn:'序列号',ip:'IP地址',port:'端口',group:'项目分组'},rows:[
    {终端名称:'C 座 1 号梯',序列号:'YS20260101',IP地址:'192.168.1.81',端口:'80',项目分组:'花园中心'},
    {终端名称:'A 座 1 号梯（东侧）',序列号:'YS20260001',IP地址:'192.168.1.51',端口:'80',项目分组:'花园中心'},
    {终端名称:'临时梯',序列号:'YS20260102',IP地址:'192.168.1.51',端口:'80',项目分组:'花园中心'},
    {终端名称:'',序列号:'',IP地址:'999.1.1.1',端口:'70000',项目分组:''},
    {终端名称:'C 座 1 号梯（重复）',序列号:'YS20260101',IP地址:'192.168.1.82',端口:'80',项目分组:'花园中心'},
  ]};
  const ipOk=ip=>/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip)&&ip.split('.').every(x=>Number(x)<=255);
  function classify(fx){const seen=new Map();return fx.rows.map((raw,i)=>{const r={line:i+2,name:String(raw[fx.mapping.name]||'').trim(),sn:String(raw[fx.mapping.sn]||'').trim(),ip:String(raw[fx.mapping.ip]||'').trim(),port:Number(raw[fx.mapping.port]||80),group:String(raw[fx.mapping.group]||'').trim()||'未分组'};
    if(!r.sn||!ipOk(r.ip)||!(r.port>=1&&r.port<=65535)||!r.name)return {...r,kind:'invalid',reason:!r.sn?'缺少序列号':!r.name?'缺少名称':!ipOk(r.ip)?'IP地址格式错误':'端口超出范围'};
    if(seen.has(r.sn))return {...r,kind:'conflict',reason:`与第${seen.get(r.sn)}行序列号重复`};seen.set(r.sn,r.line);
    const same=state.devices.find(d=>d.sn===r.sn),ipUser=state.devices.find(d=>d.ip===r.ip&&d.sn!==r.sn);
    if(ipUser)return {...r,kind:'conflict',reason:`IP已被 ${ipUser.sn} 使用`};
    if(same){if(!visibleDevices().some(d=>d.id===same.id))return {...r,kind:'conflict',reason:'该终端不在当前授权范围'};const changed=same.name!==r.name||same.ip!==r.ip||Number(same.port||80)!==r.port||same.project!==r.group;return changed?{...r,kind:'update',id:same.id,reason:'字段将更新，标为未核验'}:{...r,kind:'unchanged',id:same.id,reason:'无变化'};}
    return {...r,kind:'new',reason:'新增，标为未核验'};});}
  const kindName={new:'新增',update:'更新',conflict:'冲突（不导入）',invalid:'无效（不导入）',unchanged:'无变化'};
  C.openImportDemo=function(){L.importPreview=null;if(!W())return;const p=classify(IMPORT_FIXTURE);L.importPreview={file:IMPORT_FIXTURE.file,rows:p,epoch:state.sessionEpoch,account:state.user.account};
    const count=k=>p.filter(r=>r.kind===k).length;
    modal('导入台账',`<p>文件：${h(IMPORT_FIXTURE.file)}（演示文件）</p><h3>列对应</h3><table class="table"><tbody>${Object.entries({name:'终端名称',sn:'序列号',ip:'IP地址',port:'端口',group:'项目分组'}).map(([k,n])=>`<tr><td>${n}</td><td>← ${h(IMPORT_FIXTURE.mapping[k])}</td></tr>`).join('')}</tbody></table><h3>预览</h3><p>新增 ${count('new')} · 更新 ${count('update')} · 冲突 ${count('conflict')} · 无效 ${count('invalid')}</p><table class="table"><thead><tr><th>行</th><th>名称</th><th>序列号</th><th>IP</th><th>结果</th><th>原因</th></tr></thead><tbody>${p.map(r=>`<tr data-kind="${r.kind}"><td>${r.line}</td><td>${h(r.name)}</td><td>${h(r.sn)}</td><td>${h(r.ip)}</td><td>${kindName[r.kind]}</td><td>${h(r.reason)}</td></tr>`).join('')}</tbody></table><p class="hint">只写入本机台账，不连接设备、不修改设备设置。导入的终端需在授权范围内读取设备信息核对序列号后才算核验。</p>`,btn('取消','C.closeModal()')+btn('确认导入','C.confirmImportDemo()','primary'),true);return L.importPreview;};
  C.confirmImportDemo=function(){const p=L.importPreview;if(!p||p.epoch!==state.sessionEpoch||p.account!==state.user?.account){toast('预览已失效，请重新选择文件','error');return {ok:false};}if(!W())return {ok:false};
    const res={added:0,updated:0,skipped:p.rows.filter(r=>!['new','update'].includes(r.kind)).length};
    mutate('导入台账',{name:p.file},()=>{let id=Math.max(0,...state.devices.map(d=>d.id));for(const r of p.rows){if(r.kind==='new'){const d={...initialDevices()[0],id:++id,name:r.name,sn:r.sn,ip:r.ip,port:r.port,project:r.group,location:'待完善',online:'unknown',comm:'unknown',sleep:'unknown',version:'未知',hardware:null,activated:false,verified:false,sampledAt:null};state.devices.push(d);state.user.scope.push(d.id);const a=findUser(state.user.account);if(a&&a.scope!==state.user.scope)a.scope.push(d.id);res.added++;}else if(r.kind==='update'){const d=state.devices.find(x=>x.id===r.id);Object.assign(d,{name:r.name,ip:r.ip,port:r.port,project:r.group,verified:false});res.updated++;}}},true);
    L.importPreview=null;L.importResult=res;modal('导入结果',`<p>新增 ${res.added} 台 · 更新 ${res.updated} 台 · 跳过 ${res.skipped} 行。</p><p class="hint">新增与更新的终端显示为“未核验”。</p>`,btn('完成','C.closeModal()','primary'));render();return {ok:true,...res};};
  const EXPORT_COLUMNS=['终端名称','序列号','IP地址','端口','项目分组','位置','核验状态','最近成功采集'];
  C.exportLedger=function(){if(!G())return;const rows=visibleDevices().map(d=>[d.name,d.sn,d.ip,d.port||80,d.project,d.location||'',d.verified===false?'未核验':'已核验',d.sampledAt||'']);
    const csv=[EXPORT_COLUMNS,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');L.lastExport=csv;
    try{const a=document.createElement('a');a.download='台账导出.csv';try{a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));}catch{}document.body.appendChild(a);a.click();a.remove();}catch{}
    toast(`已导出 ${rows.length} 台终端（不含账号与密码）`,'success');return csv;};

  /* ---------- 备份与恢复 ---------- */
  const SUPPORTED='1.5';
  const activeTasks=()=>state.tasks.filter(t=>['running','pending_external','queued'].includes(t.status));
  C.openBackupDemo=function(){if(!W())return;
    modal('备份与恢复',`<h3>创建备份</h3><label class="target-row"><input type="checkbox" checked disabled>台账与分组（必选）</label><label class="target-row"><input type="checkbox" checked disabled>账号与授权（必选，密码只存校验值）</label><label class="target-row"><input id="bk-tasks" type="checkbox" checked>任务记录与操作记录</label><label class="target-row"><input id="bk-files" type="checkbox">软件包与素材文件（体积较大）</label>${btn('立即备份','C.createBackup()','primary')}<h3>从备份恢复</h3><table class="table"><tbody>${L.backups.map(b=>`<tr><td>${h(b.name)}<small>${h(b.time)}</small></td><td>${btn('检查并预览',`C.previewRestore(${jsArg(b.id)})`,'text sm')}</td></tr>`).join('')}</tbody></table><p class="hint">恢复前会先检查文件完整性与版本；不符合的备份直接拒绝，不影响当前数据。</p>`,btn('关闭','C.closeModal()'),true);};
  C.createBackup=function(){if(!W())return {ok:false};const contents=['台账与分组','账号与授权'];if(document.getElementById('bk-tasks')?.checked)contents.push('任务与审计');if(document.getElementById('bk-files')?.checked)contents.push('软件包与素材文件');
    const b={id:'b-'+(L.backups.length+1),name:`台账备份-${new Date().toISOString().slice(0,10).replace(/-/g,'')}.ysbak`,version:SUPPORTED,checksum:'ok',time:new Date().toLocaleString('zh-CN',{hour12:false}),contents,method:'一致性快照'};
    mutate('创建备份',{name:b.name},()=>{L.backups.unshift(b);L.lastBackup=b;},true);toast(`备份完成：${b.name}`,'success');C.openBackupDemo();return {ok:true,backup:b};};
  C.previewRestore=function(id){if(!W())return {ok:false};const b=L.backups.find(x=>x.id===id);if(!b)return {ok:false};
    if(b.checksum!=='ok'){L.restorePreview=null;toast('备份文件已损坏（校验不通过），已拒绝；当前数据未改变','error');return {ok:false,reason:'CORRUPT'};}
    if(b.version!==SUPPORTED){L.restorePreview=null;toast(`备份版本 ${b.version} 与本应用不兼容，已拒绝；当前数据未改变`,'error');return {ok:false,reason:'INCOMPATIBLE'};}
    const act=activeTasks().length;L.restorePreview={id,epoch:state.sessionEpoch,account:state.user.account};L.paused=false;
    modal('恢复预览',`<p>将用 ${h(b.name)}（${h(b.time)}）覆盖当前本机数据：${b.contents.map(h).join('、')}。</p><p>当前本机：账号 ${users().length} 个 · 终端 ${state.devices.length} 台 · 任务 ${state.tasks.length} 条。</p>${act?notice(`有 ${act} 个任务正在执行，需先暂停到安全检查点再恢复。`,'amber')+btn('暂停执行中任务','C.pauseForRestore()'):''}<label class="target-row"><input id="rs-fail" type="checkbox" ${L.restoreFail?'checked':''} onchange="state.local15.restoreFail=this.checked">模拟恢复失败（审阅）</label><p class="hint">恢复成功后所有人需重新登录；采集引擎先只读核验设备，不重放任何设备写操作。恢复失败时保留原数据。</p>`,btn('取消','C.closeModal()')+btn('确认恢复','C.confirmRestore()','danger'));return {ok:true,activeTasks:act};};
  C.pauseForRestore=function(){if(!W())return;L.paused=true;toast('执行中任务将在当前步骤结束后暂停（不中断已发出的设备请求）');};
  C.confirmRestore=function(){const p=L.restorePreview;if(!p||p.epoch!==state.sessionEpoch||p.account!==state.user?.account){toast('预览已失效，请重新检查备份','error');return {ok:false,reason:'STALE'};}if(!W())return {ok:false};
    if(activeTasks().length&&!L.paused){toast('仍有执行中任务，请先暂停到安全检查点','error');return {ok:false,reason:'ACTIVE_TASKS'};}
    if(L.restoreFail){L.restorePreview=null;closeModal();toast('恢复失败，已保留原数据，当前账号仍可继续使用','error');return {ok:false,reason:'FAILED_KEPT_ORIGINAL'};}
    L.restorePreview=null;L.postRestore=true;closeModal();C.logout();toast('恢复完成，请重新登录','success');return {ok:true};};

  /* ---------- 本机软件包库 ---------- */
  const COMPAT_INDEX={'ys-mt6-v6.0.14.pkg':{version:'V6.0.14',sha256:'3b7e19c0…a9f2（fixture）',hardware:['YS-MT6 / H2.1'],minVersion:'V6.0.12',size:'36.8 MB'}};
  const IMPORT_FILES=[
    {file:'ys-mt6-v6.0.14.pkg',sha256:'3b7e19c0…a9f2（fixture）'},
    {file:'vendor-x-v7.0.0.pkg',sha256:'d00d5e11…0b3c（fixture）',version:'V7.0.0'},
    {file:'ys-mt6-v6.0.14-modified.pkg',sha256:'ffff0000…1111（fixture）',claims:'ys-mt6-v6.0.14.pkg'},
  ];
  packageMeta=function(version=state.package){const p=L.packages.find(x=>x.version===version);
    if(!p||p.status!=='known')return {id:'local-'+version,version,hardware:[],minVersion:null,protocol:'dev.cgi V1',source:'本机软件包库（适配信息未确认）',size:p?.size||'未知',integrity:p?'已计算 sha256，适配信息未确认':'包不存在'};
    return {id:'local-'+version,version,hardware:[...p.hardware],minVersion:p.minVersion,protocol:'dev.cgi V1',source:'本机软件包库',size:p.size,sha256:p.sha256,integrity:'sha256 已核对兼容索引（演示，不代表真实验签）'};};
  const baseFirmware=firmware;
  firmware=function(){const html=baseFirmware();return html+`<section class="card"><h2>本机软件包库</h2><table class="table"><thead><tr><th>版本</th><th>文件</th><th>sha256</th><th>适用硬件</th><th>状态</th><th></th></tr></thead><tbody>${L.packages.map(p=>`<tr data-pkg="${h(p.version)}"><td>${h(p.version)}</td><td>${h(p.file)}</td><td><small>${h(p.sha256)}</small></td><td>${h((p.hardware||[]).join('、')||'未知')}</td><td>${p.status==='known'?'已确认，可用于升级':'适配信息未确认，禁止升级'}</td><td>${p.status==='known'?btn('选用',`C.package(${jsArg(p.version)})`,'text sm'):''}</td></tr>`).join('')}</tbody></table></section>`;};
  C.package=function(v){const p=L.packages.find(x=>x.version===v);if(!p||p.status!=='known'){toast('该软件包适配信息未确认，不能用于升级','error');return {ok:false};}state.package=v;render();return {ok:true};};
  C.importPackage=function(){if(!W())return;modal('导入本地软件包',`<p>选择文件后本机计算 sha256，并与兼容索引核对版本与适用硬件；未在索引中的文件只能登记为“适配信息未确认”，不能用于升级。</p>${IMPORT_FILES.map(f=>`<label class="target-row"><input type="radio" name="pkg-file" value="${h(f.file)}">${h(f.file)}</label>`).join('')}<p class="hint">本原型不读取或上传任何真实固件文件。</p>`,btn('取消','C.closeModal()')+btn('计算并核对','C.confirmImportPackage()','primary'));};
  C.confirmImportPackage=function(file){if(!W())return {ok:false};const name=file||[...document.querySelectorAll('[name="pkg-file"]')].find(x=>x.checked)?.value;const f=IMPORT_FILES.find(x=>x.file===name);if(!f){toast('请选择软件包文件','error');return {ok:false};}
    const idx=COMPAT_INDEX[f.claims||f.file];
    if(f.claims&&idx&&idx.sha256!==f.sha256){toast('sha256 与兼容索引不一致，已拒绝导入','error');return {ok:false,reason:'HASH_MISMATCH'};}
    if(idx&&idx.sha256===f.sha256){if(L.packages.some(p=>p.version===idx.version)){toast('该版本已在本机包库','error');return {ok:false,reason:'DUPLICATE'};}const p={version:idx.version,file:f.file,sha256:f.sha256,hardware:[...idx.hardware],minVersion:idx.minVersion,status:'known',size:idx.size};mutate('导入软件包',{name:p.version},()=>L.packages.unshift(p),true);closeModal();toast(`${p.version} 已核对并加入本机包库`,'success');render();return {ok:true,status:'known'};}
    const p={version:f.version||f.file,file:f.file,sha256:f.sha256,hardware:[],minVersion:null,status:'unconfirmed',size:'未知'};mutate('登记未确认软件包',{name:p.file},()=>L.packages.push(p),true);closeModal();toast('该文件不在兼容索引中：已登记为“适配信息未确认”，禁止用于升级','error');render();return {ok:true,status:'unconfirmed'};};

  /* ---------- 设置页：本机数据入口 ---------- */
  const baseSettings=settings;
  settings=function(){const html=baseSettings();if(!state.user||readOnly())return html;return html+`<section class="card"><h2>本机数据</h2><p class="hint">台账、账号与任务都保存在本机，不连接业务后台。</p>${btn('导入台账','C.openImportDemo()')}${btn('导出台账','C.exportLedger()')}${btn('备份与恢复','C.openBackupDemo()')}</section>`;};
  window.prototypeLocal15={digest,DEMO_RECOVERY,classify:()=>classify(IMPORT_FIXTURE),EXPORT_COLUMNS};
  render();
})();
