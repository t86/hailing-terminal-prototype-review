'use strict';

// Reviewable business prototype. All data and operations stay in memory.
const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsArg = value => JSON.stringify(String(value)).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const icons = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  device:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
  media:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 8 6 4-6 4V8z"/>',
  tasks:'<rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 4V2h7v2M9 10h7m-7 5h7"/>',
  package:'<path d="m12 2 9 5-9 5-9-5 9-5zm-9 5v10l9 5 9-5V7M12 12v10M7 4.8l9 5"/>',
  log:'<path d="M6 3h10l4 4v14H6V3zm9 0v5h5M9 12h8m-8 4h6"/>',
  users:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
  settings:'<path d="m9 3 1-1h4l1 3 3 1 3 1v4l-2 2-1 3v4l-3 1-2-2h-3l-3 2-3-2v-3l-2-3V9l3-1 2-2V3z"/><circle cx="12" cy="12" r="3"/>',
  refresh:'<path d="M20 7a9 9 0 1 0 1 9M20 3v5h-5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  shield:'<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4z"/><path d="m8 12 3 3 5-6"/>',
  network:'<rect x="8" y="2" width="8" height="5" rx="1"/><rect x="2" y="17" width="7" height="5" rx="1"/><rect x="15" y="17" width="7" height="5" rx="1"/><path d="M12 7v5H5v5m7-5h7v5"/>',
  camera:'<path d="M3 7h4l2-3h6l2 3h4v14H3V7z"/><circle cx="12" cy="13" r="4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  power:'<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  edit:'<path d="m15 3 6 6-12 12H3v-6L15 3zm-2 2 6 6"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  bell:'<path d="M4 17h16l-2-4V9a6 6 0 0 0-12 0v4l-2 4zm6 4h4"/>',
  logout:'<path d="M9 3H3v18h6m5-14 5 5-5 5m-7-5h12"/>',
};
const I = (name, cls='') => `<span class="icon ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[name] || icons.device}</svg></span>`;
const btn = (label, action, cls='', icon='') => `<button class="btn ${cls}" onclick="${action}">${icon ? I(icon) : ''}${label}</button>`;
const roleNames = {admin:'管理员',maint:'维护',viewer:'只读'};
const accounts = {
  admin:{name:'李明',account:'liming',role:'admin',initial:'李'},
  maint:{name:'张工',account:'zhangg',role:'maint',initial:'张'},
  viewer:{name:'王女士',account:'wang',role:'viewer',initial:'王'},
};
const initialDevices = () => [
  {id:1,name:'A 座 1 号梯',project:'花园中心',location:'A 座 · 东侧客梯',ip:'192.168.1.51',sn:'YS20260001',online:'online',comm:'online',sleep:'awake',version:'V6.0.12'},
  {id:2,name:'A 座 2 号梯',project:'花园中心',location:'A 座 · 西侧客梯',ip:'192.168.1.52',sn:'YS20260002',online:'online',comm:'online',sleep:'sleeping',version:'V6.0.12'},
  {id:3,name:'B 座 1 号梯',project:'花园中心',location:'B 座 · 大堂客梯',ip:'192.168.1.53',sn:'YS20260003',online:'online',comm:'offline',sleep:'unknown',version:'V6.0.11'},
  {id:4,name:'1 单元客梯',project:'滨江雅苑',location:'1 栋 · 1 单元',ip:'192.168.1.61',sn:'YS20260004',online:'online',comm:'online',sleep:'awake',version:'V6.0.12'},
  {id:5,name:'2 单元客梯',project:'滨江雅苑',location:'1 栋 · 2 单元',ip:'192.168.1.62',sn:'YS20260005',online:'online',comm:'unknown',sleep:'unknown',version:'V6.0.11'},
  {id:6,name:'西区办公梯',project:'科创大厦',location:'西区 · 低层梯',ip:'192.168.1.71',sn:'YS20260006',online:'online',comm:'online',sleep:'sleeping',version:'V6.0.12'},
  {id:7,name:'东区办公梯',project:'科创大厦',location:'东区 · 高层梯',ip:'192.168.1.72',sn:'YS20260007',online:'offline',comm:'unknown',sleep:'unknown',version:'V6.0.10'},
  {id:8,name:'停车场货梯',project:'科创大厦',location:'地下 1 层',ip:'192.168.1.73',sn:'YS20260008',online:'unknown',comm:'unknown',sleep:'unknown',version:'—'},
].map(d=>({...d,brightness:80,volume:35,speed:1,interval:5,mode:'video',netmask:'255.255.255.0',gateway:'192.168.1.1',dns:'192.168.1.254',activated:d.id!==5,playlist:['城市生活.mp4','安全乘梯.mp4'],storedFiles:['城市生活.mp4','安全乘梯.mp4','社区公告.jpg','1.txt','logo.png'],captureTime:'14:26:18',captureError:false}));
const state = {
  user:null,reviewRole:'maint',page:'overview',detailId:1,detailTab:'overview',group:'all',search:'',statusFilter:'all',selected:new Set(),
  platform:true,service:true,minimized:false,exited:false,business:false,screenshotFailure:false,networkUncertain:false,
  devices:initialDevices(),materials:[{id:1,name:'城市生活.mp4',type:'video',size:'28.4 MB',duration:'00:45',date:'10-27 10:18'},{id:2,name:'安全乘梯.mp4',type:'video',size:'16.8 MB',duration:'00:30',date:'10-26 16:40'},{id:3,name:'社区公告.jpg',type:'image',size:'1.2 MB',duration:'1920 × 1080',date:'10-26 15:22'},{id:4,name:'企业标识.png',type:'logo',size:'256 KB',duration:'600 × 180',date:'10-25 09:12'},{id:5,name:'欢迎字幕.txt',type:'text',size:'128 B',duration:'UTF-8',date:'10-25 09:12'}],
  tasks:[],taskSelected:null,package:'V6.0.13',logName:'2026-10-27.log',adminTab:'users',mediaType:'all',imported:[],jobs:{},audit:[],loginError:'',toastTimer:null,
  extraUsers:[],extraGroups:[],timers:new Set(),now:Date.now(),mutationCount:0,
};
const baseMaterials=state.materials.map(m=>({...m}));
const navs=[['overview','总览','grid'],['devices','终端列表','device'],['media','素材库','media'],['tasks','任务中心','tasks'],['firmware','软件包与升级','package'],['logs','日志与记录','log'],['admin','账号与分组','users'],['settings','本机设置','settings']];
const readOnly = () => state.user?.role==='viewer';
const visibleDevices = () => state.user ? state.devices.filter(d=>(state.user.scope || (readOnly()?[1,2,3,4]:[1,2,3,4,5,6,7,8])).includes(d.id)) : [];
const device = () => visibleDevices().find(d=>d.id===state.detailId) || visibleDevices()[0];
const dateTime = () => new Date().toLocaleTimeString('zh-CN',{hour12:false});
const totalStats = () => {const ds=visibleDevices();return {all:ds.length,online:ds.filter(d=>effectiveOnline(d)==='online').length,offline:ds.filter(d=>effectiveOnline(d)==='offline').length,unknown:ds.filter(d=>effectiveOnline(d)==='unknown').length,commError:ds.filter(d=>effectiveState(d,'comm')==='offline').length,sleeping:ds.filter(d=>effectiveState(d,'sleep')==='sleeping').length};};
const badge = (value, kind='online') => {
  const maps={online:{online:['在线','green'],offline:['离线','red'],unknown:['未知','']},comm:{online:['通信正常','green'],offline:['通信断开','amber'],unknown:['未知','']},sleep:{awake:['未休眠','blue'],sleeping:['休眠中','amber'],unknown:['未知','']},task:{cancelled:['已取消',''],prechecking:['预检中','blue'],accepted:['设备已受理','blue'],verifying:['只读核验中','blue'],running:['执行中','blue'],success:['已核验完成','green'],partial:['部分完成','amber'],uncertain:['结果待确认','amber'],failed:['失败','red'],queued:['待开始','']}};
  const [label,color]=(maps[kind]||maps.online)[value]||[value,''];return `<span class="badge ${color}">${label}</span>`;
};
const effectiveOnline = d => state.service && d.identity!=='mismatch' ? (d.reachability||d.online||'unknown') : 'unknown';
const effectiveState = (d,key) => effectiveOnline(d)==='online' && !d.sampleError && !d.stale && d.sampledAt && Date.now()-new Date(d.sampledAt).getTime()<=15000 && !(key==='sleep'&&d.comm!=='online') ? d[key] : 'unknown';
const field = (label,id,value,type='text',extra='') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${h(value)}" ${extra}></div>`;
const kv = (label,value) => `<div class="kv"><label>${label}</label><strong>${h(value)}</strong></div>`;
const notice = (text,kind='') => `<div class="notice ${kind}">${I('info')}<div>${text}</div></div>`;
function toast(message,kind='') {
  clearTimeout(state.toastTimer);
  document.getElementById('toast-root').innerHTML=`<div class="toast ${kind}">${I(kind==='error'?'info':'check')}<span>${h(message)}</span></div>`;
  state.toastTimer=setTimeout(()=>document.getElementById('toast-root').innerHTML='',3600);
}
function later(fn,ms) {const id=setTimeout(()=>{state.timers.delete(id);fn();},ms);state.timers.add(id);return id;}
function dispatchMutation(kind,payload={},run=null,local=false) {
  const auth=authorizeWrite(payload.ids||[],{local});if(!auth.ok)return auth;
  state.mutationCount++;
  state.audit.unshift({time:dateTime(),user:state.user.name,owner:state.user.account,action:kind,target:payload.sn||payload.name||'授权范围',result:'已提交'});
  if(run)run();return {ok:true,kind};
}
function mutate(kind,payload,run,local=false){const result=dispatchMutation(kind,payload,run,local);if(!result.ok)toast(result.message,'error');return result;}
function modal(title,body,footer='',wide=false) {
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)C.closeModal()"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${h(title)}"><div class="modal-head"><h2>${title}</h2><button aria-label="关闭" onclick="C.closeModal()">×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer||btn('关闭','C.closeModal()')}</div></section></div>`;
}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
function reviewbar() {
  document.getElementById('reviewbar').innerHTML=`<div class="reviewbar"><div class="review-brand">${I('grid')}交互设计画布 <span class="review-label">V1.5 · 单机自包含演示</span></div><label class="review-switch"><input type="checkbox" ${!state.platform?'checked':''} onchange="C.togglePlatform(this.checked)">本机库不可用</label><label class="review-switch"><input type="checkbox" ${!state.service?'checked':''} onchange="C.toggleService(this.checked)">采集引擎停止</label>${state.page==='detail'&&state.detailTab==='screenshot'?`<label class="review-switch"><input type="checkbox" ${state.screenshotFailure?'checked':''} onchange="C.captureScenario(this.checked)">模拟截图失败</label>`:''}${flowScenarioControl()}<span class="spacer"></span><button class="review-action" onclick="C.business()">${state.business?'返回应用':'业务设计总图'} ↗</button><button class="review-action" onclick="C.reset()">重置演示</button></div>`;
}
function titlebar(){return `<div class="titlebar"><span class="app-mark">H</span>海菱终端管理 <span class="muted">· Windows</span><div class="window-controls"><button aria-label="最小化到托盘" onclick="C.tray()">−</button><button aria-label="窗口大小">□</button><button aria-label="关闭窗口到托盘" onclick="C.tray()">×</button></div></div>`;}
function serviceStrip(){return `<div class="connection-strip"><span><i class="service-dot ${state.service?'':'off'}"></i>本机采集引擎 ${state.service?'运行中':'已停止'}</span><span><i class="service-dot ${state.platform?'':'off'}"></i>本机台账库 ${state.platform?'可用':'不可用'}</span><span class="spacer"></span><span>演示数据 · 不连接实际终端</span></div>`;}
function shell(content){
  const nav=navs.filter(([key])=>!readOnly()||['overview','devices','settings'].includes(key));
  return `<div class="window">${titlebar()}<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-symbol">H</div><div><div class="brand-name">海菱终端管理</div><div class="brand-sub">TERMINAL CONSOLE</div></div></div><div class="sidebar-label">终端管理</div>${nav.map(([key,label,icon])=>`<button class="nav-button ${state.page===key||(state.page==='detail'&&key==='devices')?'active':''}" onclick="C.nav('${key}')">${I(icon)}${label}${key==='tasks'&&state.tasks.some(t=>t.status==='running')?'<span class="nav-count">'+state.tasks.filter(t=>t.status==='running').length+'</span>':''}</button>`).join('')}<div class="sidebar-bottom"><div class="sidebar-service"><strong><i class="service-dot ${state.service?'':'off'}"></i>采集引擎${state.service?'正常':'未运行'}</strong><div>${state.service?'每 5 秒读取终端状态':'当前展示上次采集结果'}</div><div>关闭窗口可保留托盘运行</div></div></div></aside><div class="workspace"><header class="topbar"><span class="breadcrumb">${state.page==='detail'?'终端详情':navs.find(n=>n[0]===state.page)?.[1]||'总览'}</span><span class="spacer"></span>${readOnly()?'<span class="readonly-label">只读访问</span>':''}<span class="user-avatar">${state.user.initial}</span><div><div class="small strong">${state.user.name}</div><div class="muted" style="font-size:10px;margin-top:3px">${roleNames[state.user.role]}</div></div><button class="btn text" aria-label="退出登录" onclick="C.logout()">${I('logout')}</button></header><main class="content">${!state.platform?notice('本机台账库暂不可用。可继续查看已加载数据；不能改写本机台账或发起新的设备写操作。','amber'):''}${!state.service?notice('本机采集引擎已停止。设备状态显示为未知，历史设置仅供查看。','red'):''}${content}</main>${serviceStrip()}</div></div></div>`;
}
function screenArt(large=false){return `<div class="screen-art ${large?'large':''}" aria-label="终端画面示意"><div class="screen-floor"><span class="arrow">↑</span><strong class="floor">12</strong><span style="font-size:10px;color:#829db7">A 座 1 号梯</span></div><div class="screen-ad"><h3>让城市生活更美好</h3><p>HAI LIN · 城市空间</p></div><div class="screen-ticker">文明乘梯　安全同行　欢迎来到花园中心</div></div>`;}
function login(){return `<div class="window">${titlebar()}<div class="login-shell"><div class="login-brand"><div class="brand"><div class="brand-symbol">H</div><div><div class="brand-name">海菱终端管理</div><div class="brand-sub">WINDOWS CONSOLE</div></div></div><h1>每一台终端<br>都尽在掌握</h1><p>从设备状态到内容发布<br>连接现场，管理每一次呈现</p><div class="login-device-art">${screenArt()}</div><div class="login-foot">局域网终端管理 · 本机采集引擎<br>账号与设备范围由本机台账提供（单机自包含）</div></div><div class="login-form"><h1>本机账号登录</h1><p class="muted">使用本机账号登录。首次使用需创建管理员（演示已预置）。</p>${state.loginError?notice(h(state.loginError),'red'):''}<form onsubmit="event.preventDefault();C.login()"><div class="login-fields">${field('账号','login-account',accounts[state.reviewRole].account)}${field('密码','login-password','demo1234','password')}</div><div class="login-remember"><label><input type="checkbox" checked> 记住账号</label><span>本机角色：管理员/维护可写，只读禁写</span></div><button class="btn primary full" type="submit">登录 ${I('arrow')}</button></form><div class="common-accounts"><h3>已授权常用账号 · 演示入口</h3><div class="account-shortcuts">${Object.keys(accounts).map(r=>`<button onclick="C.loginAs('${r}')">${accounts[r].name}<br><span class="muted">${roleNames[r]}</span></button>`).join('')}</div></div><div class="login-server"><i class="service-dot ${state.platform?'':'off'}"></i>本机台账库${state.platform?'可用':'不可用'} · 单机库</div><div class="launch-note">此为设计演示，输入任意非空密码可登录模拟账号。<br>正式应用角色来自本机账号；审阅工具条仅用于演示，不能当作生产自选权限。本机角色不限制其他电脑直连设备未鉴权接口。</div></div></div></div>`;}
function head(title,sub,actions=''){return `<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div><div class="page-actions">${actions}</div></div>`;}
function overview(){
  const s=totalStats(),ds=visibleDevices();
  const cards=[['授权终端',s.all,'所属范围内的终端','device',''],['设备在线',state.service?s.online:0,`离线 ${state.service?s.offline:0} 台 · 未知 ${state.service?s.unknown:s.all} 台`,'network','green'],['电梯通信异常',state.service?s.commError:0,'与设备可达状态独立判定','info','amber'],['电梯休眠',state.service?s.sleeping:0,'休眠不影响设备在线判断','clock','']];
  return head('终端总览','今天，现场设备一目了然。',btn('刷新状态','C.refresh()','','refresh')+(!readOnly()?btn('添加终端','C.addDevice()','primary','plus'):''))+`<div class="stats">${cards.map(c=>`<div class="stat-card"><div class="stat-label">${c[0]}</div><div class="stat-value">${c[1]}<span style="font-size:11px;color:#9aa7b8;font-weight:400;letter-spacing:0;margin-left:7px">台</span></div><div class="stat-foot">${c[2]}</div><div class="stat-glyph ${c[4]}">${I(c[3])}</div></div>`).join('')}</div>${notice('设备在线表示本机能访问视频机；通信状态来自视频机与电梯侧链路，休眠是电梯本身的状态。')}<div class="overview-grid"><div class="stack"><section class="card flush"><div class="card-head"><div><h2>需要关注的终端</h2><p>优先处理通信异常、离线和未知状态</p></div>${btn('查看全部','C.nav(\'devices\')','text')}</div><table class="table compact"><thead><tr><th>终端 / 项目</th><th>设备</th><th>电梯通信</th><th>电梯状态</th><th></th></tr></thead><tbody>${ds.filter(d=>d.comm!=='online'||d.online!=='online').slice(0,4).map(d=>`<tr><td><button class="link" onclick="C.openDevice(${d.id})">${h(d.name)}</button><small>${h(d.project)} · ${d.ip}</small></td><td>${badge(effectiveOnline(d))}</td><td>${badge(effectiveState(d,'comm'),'comm')}</td><td>${badge(effectiveState(d,'sleep'),'sleep')}</td><td>${btn('详情',`C.openDevice(${d.id})`,'text sm')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">当前授权范围内状态正常</td></tr>'}</tbody></table></section><section class="card"><div class="card-head"><h2>项目分布</h2><span class="small muted">授权终端 ${s.all} 台</span></div>${[...new Set(ds.map(d=>d.project))].map((g,i)=>{const count=ds.filter(d=>d.project===g).length;return `<div class="health-line"><span style="width:80px;color:#6c7f99">${g}</span><div class="progress ${i===0?'green':''}"><span style="width:${count/s.all*100}%"></span></div><span class="value">${count}</span></div>`;}).join('')}<div class="status-legend"><span><i></i>在线 ${s.online}</span><span><i class="amber"></i>离线 ${s.offline}</span><span><i class="gray"></i>未知 ${s.unknown}</span><span class="spacer"></span><span>最近采集 ${state.service?dateTime():'—'}</span></div></section></div><div class="stack"><section class="card"><div class="card-head"><h2>${readOnly()?'最近状态':'最近操作'}</h2><span class="small muted">今天</span></div>${[
 ['network','花园中心 B 座 1 号梯','电梯通信断开，设备仍可访问','14:27'],['check','滨江雅苑 1 单元客梯','参数读取完成，状态正常','14:26'],['clock','花园中心 A 座 2 号梯','电梯进入休眠，HTTP 保持在线','14:23'],['device','授权终端范围已同步',readOnly()?'仅展示已授权的 4 台终端':'共 3 个项目，8 台终端','14:20']
 ].map(a=>`<div class="activity"><span class="activity-dot">${I(a[0])}</span><div><p>${a[1]}</p><p class="muted" style="font-size:11px">${a[2]}</p><small>${a[3]}</small></div></div>`).join('')}${!readOnly()?`<div class="quick-actions"><button onclick="C.nav('media')">${I('upload')}发布素材</button><button onclick="C.nav('firmware')">${I('package')}固件升级</button><button onclick="C.nav('logs')">${I('log')}设备日志</button></div>`:''}</section><section class="card"><div class="between"><div><h3>本机采集引擎</h3><p class="hint">窗口最小化后持续读取状态</p></div>${badge(state.service?'online':'offline')}</div><div class="divider" style="margin:16px 0"></div><div class="between small muted"><span>本次启动</span><span>今天 14:20</span></div><div class="between small muted" style="margin-top:12px"><span>采集范围</span><span>${s.all} 台授权终端</span></div></section></div></div>`;
}
function filteredDevices(){return visibleDevices().filter(d=>(state.group==='all'||d.project===state.group)&&(state.statusFilter==='all'||effectiveOnline(d)===state.statusFilter)&&(`${d.name} ${d.sn} ${d.ip} ${d.project}`.toLowerCase().includes(state.search.toLowerCase())));}
function devices(){
 const ds=visibleDevices(),rows=filteredDevices(),groups=[...new Set(ds.map(d=>d.project))];
 return head('终端列表','按项目分组查看当前已授权的终端。',btn('导出列表','C.exportTerminalExcel()')+(!readOnly()?btn('下载模板','C.downloadTerminalTemplate()')+btn('导入终端','C.importTerminalExcel()'):'')+btn('刷新状态','C.refresh()','','refresh')+(!readOnly()?btn('添加终端','C.addDevice()','primary','plus'):''))+`<div class="device-layout"><aside class="card group-tree"><h3>项目分组</h3><button class="tree-item ${state.group==='all'?'active':''}" onclick="C.group('all')">${I('folder')}全部授权终端 <small>${ds.length}</small></button>${groups.map(g=>`<button class="tree-item tree-indent ${state.group===g?'active':''}" onclick="C.group('${g}')">${I('folder')}${g}<small>${ds.filter(d=>d.project===g).length}</small></button>`).join('')}<div class="divider" style="margin:20px 8px"></div><p class="hint" style="padding:0 10px">列表由账号授权范围限定</p></aside><section class="card flush"><div class="toolbar"><div class="search-box">${I('search')}<input aria-label="搜索终端" placeholder="搜索名称、SN、IP 或项目" value="${h(state.search)}" oninput="C.search(this.value)"></div><select aria-label="设备状态筛选" onchange="C.filterStatus(this.value)"><option value="all">全部设备状态</option>${[['online','在线'],['offline','离线'],['unknown','未知']].map(([v,t])=>`<option value="${v}" ${state.statusFilter===v?'selected':''}>${t}</option>`).join('')}</select><span class="tag">共 ${rows.length} 台</span></div>${state.selected.size&&!readOnly()?`<div class="selection-bar">已选择 <strong>${state.selected.size}</strong> 台终端${btn('发布素材','C.publishModal()','sm soft','upload')}${btn('设置参数','C.batchParams()','sm')}${btn('升级固件','C.nav(\'firmware\')','sm')}${btn('清除选择','C.clearSelection()','text sm')}</div>`:''}<table class="table"><thead><tr>${!readOnly()?'<th class="select-col"><input type="checkbox" aria-label="全选终端" onchange="C.selectAll(this.checked)"></th>':''}<th>终端名称 / SN</th><th>项目 / IP 地址</th><th>设备状态</th><th>电梯通信</th><th>电梯休眠</th><th>操作</th></tr></thead><tbody>${rows.map(d=>`<tr>${!readOnly()?`<td class="select-col"><input type="checkbox" aria-label="选择 ${h(d.name)}" ${state.selected.has(d.id)?'checked':''} onchange="C.selectDevice(${d.id},this.checked)"></td>`:''}<td><button class="link" onclick="C.openDevice(${d.id})">${h(d.name)}</button><small class="mono">${d.sn}</small></td><td>${h(d.project)}<div class="muted mono" style="font-size:11px;margin-top:6px">${d.ip}</div></td><td>${badge(effectiveOnline(d))}</td><td>${badge(effectiveState(d,'comm'),'comm')}</td><td>${badge(effectiveState(d,'sleep'),'sleep')}</td><td>${btn(readOnly()?'查看':'管理',`C.openDevice(${d.id})`,'text sm')}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">没有符合条件的授权终端</td></tr>'}</tbody></table><div class="table-footer"><span>SN 用于核对设备身份，IP 为当前访问地址</span><div class="mini-pager"><span>‹</span><span class="active">1</span><span>›</span></div></div></section></div>`;
}
function detail(){
 const d=device();if(!d)return notice('当前账号没有可查看的终端。');
 const tabs=[['overview','概况'],['media','播放素材'],['params',readOnly()?'当前参数':'参数设置'],['network',readOnly()?'网络状态':'网络配置'],['screenshot','设备截图'],...(!readOnly()?[['maintenance','维护记录']]:[])];
 return `<div class="detail-heading"><button class="back" onclick="C.nav('devices')">${I('back')}返回终端列表</button><div class="between"><div><h1>${h(d.project)} · ${h(d.name)}</h1><div class="subline"><span class="mono">${d.sn}</span><span>${d.ip}</span><span>${h(d.location)}</span></div></div><div class="flex">${readOnly()?'<span class="readonly-label">只读账号 · 可查看当前设置</span>':''}${btn('刷新状态','C.refresh()','','refresh')}</div></div></div><div class="tabs">${tabs.map(([key,label])=>`<button class="${state.detailTab===key?'active':''}" onclick="C.detailTab('${key}')">${label}</button>`).join('')}</div>${d.online!=='online'?notice('当前终端无法可靠访问，以下为上次采集的设置；电梯通信与休眠显示未知。','amber'):''}${({overview:detailOverview,media:detailMedia,params:detailParams,network:detailNetwork,screenshot:detailScreenshot,maintenance:detailMaintenance}[state.detailTab]||detailOverview)(d)}`;
}
function detailOverview(d){return `<div class="detail-layout"><div class="stack"><section class="card"><div class="card-head"><h2>终端状态</h2><span class="small muted">${state.service?'最近采集 '+dateTime():'历史记录'}</span></div><div class="device-state-row"><div class="state-box"><label>设备可达性</label>${badge(effectiveOnline(d))}</div><div class="state-box"><label>电梯通信</label>${badge(effectiveState(d,'comm'),'comm')}</div><div class="state-box"><label>电梯休眠</label>${badge(effectiveState(d,'sleep'),'sleep')}</div></div><p class="hint" style="margin-top:17px">通信与休眠由终端采集。无法可靠判断时显示“未知”，不延用历史正常状态。</p></section><section class="card"><div class="card-head"><h2>基本信息</h2><span class="tag">${d.activated?'设备已激活':'设备未激活'}</span></div><div class="kv-grid">${kv('终端序列号',d.sn)}${kv('固件版本',d.version)}${kv('硬件版本','YS-MT6 / H2.1')}${kv('协议版本','dev.cgi V1')}${kv('安装位置',d.location)}${kv('显示方向','横屏 · 1920 × 1080')}${kv('当前播放模式',d.mode==='video'?'视频循环':'图片轮播')}${kv('所属分组',d.project)}</div></section><section class="card"><div class="between"><div><h2>存储空间</h2><p class="hint">已使用 2.8 GB / 共 8.0 GB</p></div><span class="muted small">35%</span></div><div class="progress" style="margin-top:17px;height:8px"><span style="width:35%"></span></div><div class="status-legend"><span>视频 2 个</span><span>图片 1 个</span><span>字幕 1 个</span><span>Logo 1 个</span></div></section></div><div class="stack"><section class="card"><div class="card-head"><h2>最近终端画面</h2>${btn('查看',"C.detailTab('screenshot')",'text sm')}</div>${screenArt()}<div class="screen-caption"><span>采集于 ${d.captureTime}</span><span>画面示意</span></div></section><section class="card"><div class="card-head"><h2>当前播放设置</h2></div><div class="settings-row"><label>亮度</label><strong>${d.brightness}%</strong></div><div class="settings-row"><label>音量</label><strong>${d.volume}%</strong></div><div class="settings-row"><label>素材顺序</label><span class="small muted">${d.playlist.length} 个视频循环</span></div>${!readOnly()?`<div style="margin-top:19px">${btn('调整参数',"C.detailTab('params')",'full','settings')}</div>`:''}</section></div></div>`;}
function detailMedia(d){flowInit();const ro=readOnly(),draft=ro?{mode:d.mode,video:d.playlist,image:d.imagePlaylist}:mediaDraft(d),list=draft[draft.mode],activeList=d.mode==='image'?d.imagePlaylist:d.playlist,changed=!ro&&flowChanged(draft);return `<div class="detail-layout"><div class="stack"><section class="card"><div class="card-head"><div><h2>设备生效配置</h2><p>上次读取 ${h(d.sampledAt?new Date(d.sampledAt).toLocaleString('zh-CN'):'尚无采集时间')}</p></div><span class="badge green">${d.mode==='image'?'图片':'视频'}</span></div><p>${activeList.map(h).join(' → ')||'无列表证据'}</p><p class="hint">当前生效Logo：${h(d.logoFile)} · 字幕文件：${h(d.textFile)}</p></section><section class="card"><div class="card-head"><div><h2>${ro?'当前播放列表':'播放草稿'}</h2><p>${ro?'仅查看生效值':changed?'有未发布修改，草稿按账号和设备保留':'模式与顺序只在发布后写入设备'}</p></div><div class="radio-strip">${['video','image'].map(mode=>`<button ${ro?'disabled':''} class="${draft.mode===mode?'active':''}" onclick="C.mode('${mode}')">${mode==='video'?'视频':'图片'}</button>`).join('')}</div></div>${list.map((name,i)=>`<div class="playlist-row"><span class="playlist-index">${i+1}</span><span class="file-thumb">${draft.mode==='video'?'MP4':'IMG'}</span><div><strong>${h(name)}</strong><small>${d.storedFiles.includes(name)?'设备已有文件':'待从本机上传'} · 草稿第 ${i+1} 项</small></div>${!ro?`<div class="move-controls"><button aria-label="上移 ${h(name)}" onclick="C.moveTrack(${i},-1)">↑</button><button aria-label="下移 ${h(name)}" onclick="C.moveTrack(${i},1)">↓</button><button aria-label="从草稿移除 ${h(name)}" onclick="C.removeTrack(${i})">×</button></div>`:''}</div>`).join('')||'<p class="hint">草稿列表为空，不能发布空列表。</p>'}${!ro?`<div class="form-footer">${btn('添加到草稿','C.addTrackModal()','sm')}${btn('放弃草稿','C.discardMediaDraft()','text sm')}<span class="spacer"></span>${btn('审阅并发布草稿','C.publishCurrentPlaylist()','primary')}</div>`:''}</section><section class="card flush"><div class="card-head"><div><h2>设备已存素材</h2><p>与本机素材库分开；文件名不证明字节内容一致</p></div>${!ro?btn('仅上传文件','C.uploadToDevice()','soft sm','upload'):''}</div><table class="table compact"><thead><tr><th>路径 / 文件名</th><th>引用</th>${!ro?'<th>操作</th>':''}</tr></thead><tbody>${d.storedFiles.map(name=>`<tr><td>${h(name)}</td><td>${fileReferenced(d,name)?'<span class="tag">生效配置引用中</span>':'未引用'}</td>${!ro?`<td>${['logo.png','1.txt',d.logoFile,d.textFile].includes(name)?'<span class="hint">单例文件按专用流程</span>':`<button class="btn text sm" ${fileReferenced(d,name)?'disabled title="请先发布不引用该文件的新配置"':''} onclick="C.deleteFile(${jsArg(name)})">删除</button>`}</td>`:''}</tr>`).join('')}</tbody></table></section></div><section class="card" style="height:max-content"><h2>发布规则</h2><p class="hint">视频和图片分别编辑。当前演示使用保守槽位：视频3项、图片5项，真实上限待能力核定。上传文件与应用顺序是两个独立选择；Logo / TXT只走专用上传，不改视频列表。</p>${screenArt()}<p class="hint">画面仅设计示意，不是发布验收证据。</p></section></div>`;}
function detailParams(d){flowInit();const ro=readOnly(),draft=ro?{values:paramValues(d)}:paramDraft(d),values=draft.values;return `<section class="card" style="max-width:930px"><div class="card-head"><div><h2>${ro?'当前设备参数':'参数草稿'}</h2><p>当前值与目标值分开；只提交变化字段</p></div>${ro?'<span class="readonly-label">只读</span>':''}</div><div class="form-grid">${[['brightness','亮度（1—99）'],['volume','音量（1—99）'],['speed','字幕速度（0/1/2）'],['interval','图片间隔（秒）']].map(([k,label])=>`<div class="field"><label for="${k}">${label} · 当前 ${h(d[k])}</label><input id="${k}" type="number" value="${h(values[k])}" ${ro?'readonly':''} onchange="C.paramInput('${k}',this.value)"></div>`).join('')}<div class="field full"><label for="subtitle">滚动字幕 · 当前值：${h(d.subtitle)}</label><textarea id="subtitle" rows="3" style="width:100%" ${ro?'readonly':''} oninput="C.paramInput('subtitle',this.value);document.getElementById('subtitle-bytes').textContent=new TextEncoder().encode(this.value).length">${h(values.subtitle)}</textarea><p class="hint">UTF-8 <span id="subtitle-bytes">${new TextEncoder().encode(values.subtitle).length}</span> 字节 · 演示能力上限256字节；真实长度与setstxt路线待型号验收。无真实内容回读字段，提交后文字内容仍待确认。</p></div></div>${!ro?`<div class="form-footer"><span class="hint">字段串行发送；明确失败后停止后续字段，不自动回滚。</span><span class="spacer"></span>${btn('审阅变化字段','C.saveParams()','primary')}</div>`:''}</section>`;}
function isNetworkObservationFresh(obs,freshMs=30000){
  if(!obs)return false;
  const raw=obs.observedAt||obs.receivedAt;
  if(!raw)return false;
  const t=new Date(raw).getTime();
  if(!Number.isFinite(t))return false;
  return Date.now()-t<freshMs;
}
function ensureNetworkObservationForWrite(d){
  // 写前网络观察新鲜度：缺失/无效时间视作不新鲜；过期则先只读 get_network。返回 false 必须拦写。
  if(!d||!state.user||!state.service)return false;
  if(d.externalNetworkChange&&!sameFlow(d.externalNetworkChange.trustedConfig,d.externalNetworkChange.lastRuntime||d.networkRuntime)){
    // 已有外部变化待确认上下文时，不靠刷新抹掉目标来解锁
    return true;
  }
  if(isNetworkObservationFresh(d.networkObservation))return true;
  return !!readNetworkForPage(d,true);
}
function recordEndpointObservation(ctx,endpoint,role,f,_d){
  // 每个 endpoint 独立记录可达性/SN；不可达时不取内存 facts 冒充本轮响应
  let ok=true;
  if(f.networkAccess){
    ok = role==='old' ? f.networkAccess.old!==false : f.networkAccess.next!==false;
  }
  const observedSN = ok ? f.sn : null;
  const identity = !ok ? 'unchecked' : (observedSN===ctx.sn ? 'match' : 'mismatch');
  const entry={
    endpoint, role,
    observedAt:new Date().toISOString(),
    reachable:ok,
    observedSN,
    identity,
    config: ok && identity==='match' ? networkWire(f.networkConfig) : null,
    runtime: ok && identity==='match' ? networkWire(f.networkRuntime) : null,
    error: ok ? (identity==='match' ? null : 'SN不符，本地址配置不采信') : '地址不可达/无响应'
  };
  ctx.endpoints[endpoint]=entry;
  return entry;
}
function captureExternalNetworkChange(d){
  if(!d?.networkConfig||!d?.networkRuntime||sameFlow(d.networkConfig,d.networkRuntime))return null;
  if(d.externalNetworkChange)return d.externalNetworkChange;
  const ctx={
    id:`ext-${d.id}-${Date.now()}`,
    deviceId:d.id,
    sn:d.sn,
    capturedAt:new Date().toISOString(),
    oldEndpoint:d.networkRuntime.ip||d.ip,
    newEndpoint:d.networkConfig.ip,
    trustedConfig:cloneFlow(d.networkConfig),
    runtimeAtCapture:cloneFlow(d.networkRuntime),
    lastRuntime:cloneFlow(d.networkRuntime),
    endpoints:{},
    status:'pending_external',
    platformSync:'not_started',
    expectedRegistryVersion:d.registryVersion??1,
    ownerAccount:state.user?.account||null,
    sessionEpoch:state.sessionEpoch||0
  };
  d.externalNetworkChange=ctx;
  return ctx;
}
function verifyExternalNetworkChange(d){
  if(!d||!state.user||!state.service){toast('请先恢复会话和本机采集引擎','error');return;}
  const f=state.facts[d.id];
  if(!f){toast('缺少设备事实，无法只读核验','error');return;}
  const ctx=captureExternalNetworkChange(d)||d.externalNetworkChange;
  if(!ctx){toast('当前无外部变化待确认上下文');render();return;}
  const oldIp=ctx.oldEndpoint;
  const targetIp=ctx.newEndpoint||ctx.trustedConfig?.ip;
  state.requestLog.push({at:new Date().toISOString(),owner:state.user.account,deviceId:d.id,sn:d.sn,endpoint:oldIp,action:'旧址 get_network + info（外部变化只读）',write:false,method:'GET'});
  const oldObs=recordEndpointObservation(ctx,oldIp,'old',f,d);
  let newObs=null;
  if(targetIp){
    // 旧址不可达/错 SN 不阻断新址核验；目标址必须有本轮独立请求
    state.requestLog.push({at:new Date().toISOString(),owner:state.user.account,deviceId:d.id,sn:d.sn,endpoint:targetIp,action:'目标址 get_network + info（外部变化只读）',write:false,method:'GET'});
    newObs=recordEndpointObservation(ctx,targetIp,'new',f,d);
  }
  const trusted=networkComparable(ctx.trustedConfig);
  // 只能用本轮目标新址的独立成功响应判 verified；不得用内存 facts / 旧缓存 / 旧址响应冒充
  const newOk=!!(newObs&&newObs.reachable&&newObs.identity==='match'&&newObs.config&&newObs.runtime
    &&sameFlow(networkComparable(newObs.config),trusted)
    &&sameFlow(networkComparable(newObs.runtime),trusted));
  const bothUnreachable=[oldObs,newObs].filter(Boolean).length>0&&[oldObs,newObs].filter(Boolean).every(o=>!o.reachable);
  const newUnreachable=!!newObs&&!newObs.reachable;
  const wrongNewSn=!!newObs&&newObs.identity==='mismatch';
  const drifted=!!newObs&&newObs.reachable&&newObs.identity==='match'&&!newOk;
  if(newOk){
    ctx.status='device_verified';
    ctx.platformSync=(ctx.platformSync==='synced')?'synced':'pending_review';
    ctx.verifiedAt=new Date().toISOString();
    ctx.verifiedEndpoint=targetIp;
    // 展示仅采信目标新址本轮响应
    d.networkConfig=networkComparable(newObs.config);
    d.networkRuntime=networkComparable(newObs.runtime);
    d.networkObservation={endpoint:targetIp,observedAt:newObs.observedAt,observedSN:newObs.observedSN,identity:'match',transport:'response',config:newObs.config,runtime:newObs.runtime,externalChange:true};
    d.networkReadError='';
    toast('外部变化已只读核验：目标新址同 SN，配置与运行值均符合最初目标；请确认是否采纳到本机台账（不会自动改写，也不会补发改址命令）','success');
  }else{
    ctx.status='pending_external';
    ctx.verifiedAt=null;
    ctx.verifiedEndpoint=null;
    // 不可达时不把 facts 写成假成功观察
    if(newObs?.reachable&&newObs.identity==='match'){
      d.networkConfig=networkComparable(newObs.config);
      d.networkRuntime=networkComparable(newObs.runtime);
      d.networkObservation={endpoint:targetIp,observedAt:newObs.observedAt,observedSN:newObs.observedSN,identity:'match',transport:'response',config:newObs.config,runtime:newObs.runtime,externalChange:true};
    }else if(oldObs?.reachable&&oldObs.identity==='match'){
      d.networkObservation={endpoint:oldIp,observedAt:oldObs.observedAt,observedSN:oldObs.observedSN,identity:'match',transport:'response',config:oldObs.config,runtime:oldObs.runtime,externalChange:true};
    }
    const reasons=[];
    if(bothUnreachable)reasons.push('双址不可达');
    else if(newUnreachable)reasons.push('目标新址不可达');
    if(wrongNewSn)reasons.push('目标新址错 SN');
    if(oldObs?.identity==='mismatch')reasons.push('旧址错 SN（不采信旧址，不阻断新址）');
    if(drifted)reasons.push('配置漂移/未等于最初可信目标');
    if(!reasons.length)reasons.push('尚未取得目标新址独立成功响应');
    toast('外部变化仍待确认：'+reasons.join('；')+'；保持写锁，可继续只读核验','error');
  }
  render();
}
function invalidateExternalProof(ctx, reason){
  if(!ctx)return;
  ctx.status='pending_external';
  ctx.platformSync='pending_review';
  ctx.verifiedAt=null;
  ctx.verifiedEndpoint=null;
  toast(reason||'核验证据已失效，请重新只读核验','error');
}
function externalCasProofValid(ctx, snapshotTrusted=null, options={}){
  // 准备弹窗与确认登记共用：新鲜度 + 全字段比对 + ctx/目标一致性
  if(!ctx||ctx.status!=='device_verified')return {ok:false,reason:'设备侧尚未只读核验收敛，不能登记'};
  const endpoint=ctx.verifiedEndpoint||ctx.newEndpoint;
  const verified=ctx.endpoints?.[endpoint];
  if(!verified)return {ok:false,reason:'缺少目标新址核验证据，请先只读核验'};
  if(!verified.reachable||verified.identity!=='match')return {ok:false,reason:'目标新址证据不可达或 SN 不符，请重新只读核验'};
  if(!verified.config||!verified.runtime)return {ok:false,reason:'目标新址缺少 config/runtime 证据，请重新只读核验'};
  // 新鲜度：优先 verifiedAt，其次 endpoint.observedAt；缺失/无效/过期均不可沿用
  const freshProbe={observedAt:ctx.verifiedAt||verified.observedAt, receivedAt:verified.observedAt};
  if(!isNetworkObservationFresh(freshProbe, options.freshMs||30000)){
    return {ok:false,reason:'核验证据已过期或不新鲜，请重新只读核验'};
  }
  const trusted=networkComparable(ctx.trustedConfig);
  const conf=networkComparable(verified.config);
  const run=networkComparable(verified.runtime);
  if(!sameFlow(conf,trusted)||!sameFlow(run,trusted)){
    return {ok:false,reason:'核验证据与最初可信目标全字段不一致，请重新只读核验'};
  }
  if(snapshotTrusted){
    const snap=networkComparable(snapshotTrusted);
    if(!sameFlow(snap,trusted)||!sameFlow(conf,snap)||!sameFlow(run,snap)){
      return {ok:false,reason:'弹窗目标快照与当前冻结目标/证据不一致，请重新审阅'};
    }
  }
  if(options.expectCtxId&&ctx.id!==options.expectCtxId)return {ok:false,reason:'外部变化上下文已切换，不得沿用旧证明登记'};
  if(options.expectEndpoint&&endpoint!==options.expectEndpoint)return {ok:false,reason:'核验目标地址已变化，请重新只读核验'};
  if(options.expectSn&&ctx.sn!==options.expectSn)return {ok:false,reason:'目标 SN 已变化，请重新只读核验'};
  return {ok:true, verified, endpoint, trusted};
}
function reviewExternalPlatformSync(id){
  if(readOnly()){toast('只读账号不能改写本机台账','error');return;}
  if(!flowCanEdit())return;
  const auth=authorizeWrite([id]);
  if(!auth.ok){toast(auth.message,'error');return;}
  const d=state.devices.find(x=>x.id===id);
  if(!d?.externalNetworkChange){toast('没有外部变化待登记上下文','error');return;}
  const ctx=d.externalNetworkChange;
  const proof=externalCasProofValid(ctx);
  if(!proof.ok){invalidateExternalProof(ctx, proof.reason);render();return;}
  if(!state.user||!state.platform||!state.service){toast('本机库或采集引擎不可用，暂不能采纳到台账','error');ctx.platformSync='pending_review';render();return;}
  // 弹窗绑定 owner/sessionEpoch/device/SN/ctx、expectedRegistryVersion 与证据快照
  state.pendingExternalRegister={
    deviceId:d.id,
    ctxId:ctx.id,
    owner:state.user.account,
    sessionEpoch:state.sessionEpoch||0,
    sn:ctx.sn,
    trustedConfig:cloneFlow(ctx.trustedConfig),
    oldEndpoint:ctx.oldEndpoint,
    newEndpoint:ctx.newEndpoint,
    expectedRegistryVersion:d.registryVersion??ctx.expectedRegistryVersion??1,
    verifiedEndpoint:proof.endpoint,
    verifiedAt:ctx.verifiedAt||proof.verified.observedAt,
    verifiedConfig:cloneFlow(proof.verified.config),
    verifiedRuntime:cloneFlow(proof.verified.runtime),
    proofObservedAt:proof.verified.observedAt
  };
  modal('采纳地址到本机台账', `<p>设备已只读核验。确认后按最初可信目标更新<strong>本机台账中的访问地址</strong>。不会改写设备上读到的配置/运行值。</p><div class="diff-table"><div><b>字段</b><b>可信目标</b></div>${['ip','netmask','gateway','dns'].map(k=>`<div><span>${k}</span><strong>${h(ctx.trustedConfig[k]??'')}</strong></div>`).join('')}</div><p class="hint">SN ${h(ctx.sn)} · 旧址 ${h(ctx.oldEndpoint)} → 新址 ${h(ctx.newEndpoint)} · 台账版本 ${h(String(state.pendingExternalRegister.expectedRegistryVersion))} · 核验时间 ${h(state.pendingExternalRegister.proofObservedAt||'')}${ctx.platformSync==='conflict'?' · 上次版本冲突后重新确认':''}</p><p class="hint review-only" data-review="entityVersion">审阅：expectedRegistryVersion / sessionEpoch 见开发说明；弹窗仅展示用户可读台账版本。</p>`, btn('取消','C.closeModal()')+btn('确认采纳','C.confirmExternalPlatformSync()','primary'), true);
}
function confirmExternalPlatformSync(){
  const p=state.pendingExternalRegister;if(!p)return;
  // 撤权/换账号/会话变化 → 零登记
  if(!state.user||state.user.account!==p.owner||(state.sessionEpoch||0)!==p.sessionEpoch){
    toast('会话或账号已变化，零登记','error');
    state.pendingExternalRegister=null;closeModal();render();return;
  }
  if(readOnly()){toast('只读账号不能改写本机台账','error');state.pendingExternalRegister=null;closeModal();return;}
  const auth=authorizeWrite([p.deviceId]);
  if(!auth.ok){toast(auth.message,'error');state.pendingExternalRegister=null;closeModal();render();return;}
  // 平台/服务离线 → 零登记，保留上下文
  if(!state.platform||!state.service){
    const d0=state.devices.find(x=>x.id===p.deviceId);
    if(d0?.externalNetworkChange)d0.externalNetworkChange.platformSync='pending_review';
    toast('本机库或采集引擎不可用，未改写台账，保留原地址与待确认上下文','error');
    state.pendingExternalRegister=null;closeModal();render();return;
  }
  const d=state.devices.find(x=>x.id===p.deviceId);
  if(!d?.externalNetworkChange||d.externalNetworkChange.id!==p.ctxId){toast('待登记上下文已变化，请重新核验','error');state.pendingExternalRegister=null;closeModal();return;}
  const ctx=d.externalNetworkChange;
  if(d.sn!==p.sn||!visibleDevices().some(x=>x.id===d.id)){toast('目标不在当前授权范围或 SN 不符，零登记','error');state.pendingExternalRegister=null;closeModal();render();return;}
  // 确认时再次完整校验：新鲜度 + 全字段 + ctx/目标快照
  const proof=externalCasProofValid(ctx, p.trustedConfig, {
    expectCtxId:p.ctxId,
    expectEndpoint:p.verifiedEndpoint,
    expectSn:p.sn
  });
  if(!proof.ok){
    invalidateExternalProof(ctx, proof.reason);
    state.pendingExternalRegister=null;closeModal();render();return;
  }
  // 弹窗内冻结的证据快照也必须仍与当前证据一致
  if(p.verifiedConfig&&p.verifiedRuntime){
    if(!sameFlow(networkComparable(p.verifiedConfig),networkComparable(proof.verified.config))
      ||!sameFlow(networkComparable(p.verifiedRuntime),networkComparable(proof.verified.runtime))){
      invalidateExternalProof(ctx,'弹窗证据快照与当前核验结果不一致，请重新只读核验');
      state.pendingExternalRegister=null;closeModal();render();return;
    }
  }
  // 幂等：主台账已是可信目标且已 synced
  if(ctx.platformSync==='synced'&&d.ip===ctx.trustedConfig.ip){
    toast('本机已记录，幂等跳过','success');
    state.pendingExternalRegister=null;closeModal();render();return;
  }
  // CAS 版本冲突
  if((d.registryVersion??1)!==p.expectedRegistryVersion){
    ctx.platformSync='conflict';
    // 冲突后仍保持 device_verified，允许重新审阅恢复；不清除证据
    state.requestLog.push({at:new Date().toISOString(),owner:state.user.account,deviceId:d.id,sn:d.sn,endpoint:d.ip,action:'本机台账登记冲突（外部变化本地写）',write:true,method:'POST',data:{expectedRegistryVersion:p.expectedRegistryVersion,actualRegistryVersion:d.registryVersion}});
    toast('台账 registryVersion 冲突，保留主 IP 与上下文；请重新审阅','error');
    state.pendingExternalRegister=null;closeModal();render();return;
  }
  // 成功：只更新主台账，绝不反写 f.networkConfig/runtime
  state.requestLog.push({at:new Date().toISOString(),owner:state.user.account,deviceId:d.id,sn:d.sn,endpoint:d.ip,action:'本机台账登记（外部变化本地写）',write:true,method:'POST',data:{trustedIp:ctx.trustedConfig.ip,expectedRegistryVersion:p.expectedRegistryVersion}});
  d.ip=ctx.trustedConfig.ip;
  d.registryVersion=(d.registryVersion??1)+1;
  ctx.platformSync='synced';
  ctx.status='registered';
  d.externalNetworkChange=null;
  state.pendingExternalRegister=null;
  closeModal();
  toast('本机台账已采纳：主台账已按可信目标更新（未改写设备状态）','success');
  render();
}
function readNetworkForPage(d,force=false){flowInit();if(!d||!state.user||!state.service||!visibleDevices().some(x=>x.id===d.id)||d.networkLock)return false;const f=state.facts[d.id];if(d.online!=='online'||f.sn!==d.sn){d.networkReadError='当前网络读取失败或SN不符，保留上次配置';return false;}if(!force&&d.networkObservation&&Date.now()-new Date(d.networkObservation.observedAt).getTime()<30000)return true;const observedAt=new Date().toISOString();d.networkConfig=cloneFlow(f.networkConfig);d.networkRuntime=cloneFlow(f.networkRuntime);d.networkObservation={endpoint:d.ip,observedAt,observedSN:f.sn,identity:'match',transport:'response',config:networkWire(f.networkConfig),runtime:networkWire(f.networkRuntime)};d.networkReadError='';state.requestLog.push({at:observedAt,owner:state.user.account,deviceId:d.id,sn:d.sn,endpoint:d.ip,action:'get_network + info 页面读取',write:false});return true;}
function networkDisplay(title,p,observation=null){return `<div class="runtime-block"><h3>${title}</h3><p class="hint">采集地址 ${h(observation?.endpoint||'尚无设备观察')} · ${h(observation?.observedAt||'未取得')} · SN ${h(observation?.observedSN||'未核对')}</p><div class="runtime-values">${[['ip','IP'],['netmask','掩码'],['gateway','网关'],['dns','DNS']].map(([k,label])=>`<div><span>${label}</span><strong>${h(p?.[k]||'未设置')}</strong></div>`).join('')}</div></div>`;}
function detailNetwork(d){flowInit();const ro=readOnly(),job=state.jobs[d.id],p=state.networkDrafts?.[draftKey(d.id)]||d.networkConfig;return `<section class="card" style="max-width:950px"><div class="card-head"><div><h2>静态IPv4配置</h2><p>本机台账地址 ${h(d.ip)} · SN ${h(d.sn)}</p></div>${ro?'<span class="readonly-label">只读</span>':''}</div>${d.networkReadError?notice(h(d.networkReadError),'amber'):''}${job?networkJob(job,d):externalNetworkPanel(d)}${networkDisplay('保存配置 config',d.networkConfig,d.networkObservation)}${networkDisplay('运行配置 runtime',d.networkRuntime,d.networkObservation)}<div class="divider"></div><h3>拟修改配置</h3><div class="form-grid">${[['ip','IP地址'],['netmask','子网掩码'],['gateway','网关（可留空）'],['dns','DNS（可留空，英文逗号分隔）']].map(([k,label])=>field(label,'net-'+({netmask:'mask'}[k]||k),p[k],'text',ro?'readonly':`oninput="C.networkInput('${k}',this.value)"`)).join('')}</div><div id="network-validation"></div>${!ro?`<div class="form-footer"><span class="hint">不修改电脑网卡；prepared失败不发送设备设置。</span><span class="spacer"></span>${btn('预检并审阅完整差异','C.saveNetwork()','primary','network')}</div>`:''}</section>`;}
function externalNetworkPanel(d){
  const mismatch=d.networkConfig&&d.networkRuntime&&!sameFlow(d.networkConfig,d.networkRuntime);
  const ctx=d.externalNetworkChange;
  if(!mismatch&&!ctx)return notice('只探测明确输入的目标地址。目标无响应不证明没有IP冲突。');
  if(mismatch&&!ctx)captureExternalNetworkChange(d);
  const c=d.externalNetworkChange;
  const trusted=c?.trustedConfig||d.networkConfig;
  const oldIp=c?.oldEndpoint||d.networkRuntime?.ip;
  const newIp=c?.newEndpoint||d.networkConfig?.ip;
  const endpointView=c?.endpoints?Object.values(c.endpoints).map(e=>`<div class="hint">${h(e.role)} ${h(e.endpoint)} · ${e.reachable?'可达':'不可达'} · SN ${h(e.observedSN||'未取得')} · ${h(e.identity)}${e.error?' · '+h(e.error):''}</div>`).join(''):'';
  const casBtn=!readOnly()&&c?.status==='device_verified'&&c.platformSync!=='synced'?btn(c.platformSync==='conflict'?'版本冲突后重新确认采纳':'确认采纳到本机台账',`C.reviewExternalPlatformSync(${d.id})`,'sm'):'';
  return `<div class="stage-summary"><div class="between"><strong>外部变化（无本机改址任务）</strong>${badge(c?.status==='device_verified'?(c.platformSync==='synced'?'已写入本机台账':'待写入本机台账'):'待只读核验','task')}</div><p class="mono">旧址 ${h(oldIp)} → 最初可信目标 ${h(trusted?.ip||newIp)}</p><div class="hint">保留最初可信目标与旧/新址上下文；旧址不可达仍检查新址；双址不可达/错SN/配置漂移均保持待确认。不补发 set_network，不伪造本机写任务。</div>${endpointView}<div style="margin-top:10px">${btn('只读核验外部变化',`C.verifyNetwork(${d.id})`,'soft sm','refresh')}${casBtn}</div></div>`;
}
function networkJob(job,d){const t=state.tasks.find(t=>t.id===job.taskId),r=t?.results[0];return `<div class="stage-summary"><div class="between"><strong>网络变更 ${h(networkPhaseLabels[r?.networkPhase]||job.phase||job.stage||'prepared')}</strong>${badge(r?.state||job.status,'task')}</div><p class="mono">登记旧址 ${h(job.old)} → 目标 ${h(job.target)}</p><div class="hint">${h(r?.message||job.message||'准备中')}<br>设备：${h(r?.deviceResult||'not_started')} · 本机台账：${h(r?.platformSync||'not_required')}</div>${networkObservationsView(r)}${r&&['uncertain','failed','success'].includes(r.state)?`<div style="margin-top:10px">${btn('继续只读核验',`C.verifyNetwork(${d.id})`,'soft sm','refresh')}${r.platformSync!=='synced'&&r.deviceResult==='verified'?btn('仅重试保存本机记录',`C.retryPlatform(${t.id})`,'sm'):''}</div>`:''}</div>`;}
function publishModal(materialId=null,ids=null){flowInit();if(!flowCanEdit())return;const fromDraft=state.publishFromDraft,sourceDevice=fromDraft?state.devices.find(d=>d.id===fromDraft):null,draft=sourceDevice?mediaDraft(sourceDevice):null;const type=draft?.mode||(materialId?state.materials.find(m=>m.id===materialId)?.type:state.publishType||'video');if(!type)return;
 let files;if(draft){files=draft[type].map(name=>state.materials.find(m=>m.name===name&&m.type===type)||{id:null,name,type,size:'设备已有文件'});}else files=state.materials.filter(m=>m.type===type);
 state.publishPlan={fromDraft:fromDraft||null,owner:state.user.account,baseline:draft?.baseline,mode:type,files:cloneFlow(files),targetIds:ids||[...state.selected],uploadOnly:Boolean(state.publishUploadOnly),base:draft?cloneFlow(draft.base):null};state.publishMaterialIds=materialId?[materialId]:files.map(m=>m.id);
 modal(type==='logo'?'专用Logo发布':type==='text'?'专用TXT字幕发布':draft?'审阅播放草稿':'选择素材与发布目标',`<p>${draft?'本次完整顺序严格使用当前设备草稿。':'每次选择一种素材类型；本机库不等于设备已有文件。'}</p>${!draft?`<div class="radio-strip">${[['video','视频'],['image','图片'],['logo','Logo'],['text','字幕TXT']].map(([v,n])=>`<button class="${type===v?'active':''}" onclick="C.publishType('${v}')">${n}</button>`).join('')}</div>`:''}<div class="stage-summary"><strong>完整有序文件清单 · ${h(type)}</strong>${files.map((m,i)=>`<label class="checkline" style="margin:9px 0">${draft?'':`<input type="checkbox" name="publish-file" value="${m.id}" ${state.publishMaterialIds.includes(m.id)?'checked':''}>`}<span>${i+1}. ${h(m.name)} · ${h(m.size)}${m.compatibility==='unconfirmed'?' · 兼容未确认，不可发布':''}</span></label>`).join('')||'<p>无可用文件</p>'}${draft?`<p class="hint">旧模式 ${h(draft.base.mode)} / 顺序 ${draft.base[type].map(h).join(' → ')}<br>新模式 ${h(type)} / 顺序 ${draft[type].map(h).join(' → ')}</p>`:''}</div>${targetChoices(ids)}${['video','image'].includes(type)?`<label class="checkline" style="margin-top:16px"><input type="checkbox" id="publish-order" ${!state.publishUploadOnly?'checked':''}>上传后应用上方完整顺序${draft?'（即当前草稿）':''}</label>`:'<p class="hint">专用上传，不更改视频 / 图片播放列表。显示生效待协议或人工画面确认；不自动重启。</p>'}${!draft?'<label class="checkline" style="margin-top:12px"><input type="checkbox" id="publish-overwrite">我明确同意覆盖所选终端已有同名文件（执行前逐台复核）</label>':''}<p class="hint">本原型兼容配置均为演示。只记录名称/大小证据，不声称文件hash或完整画面验收。</p>`,btn('取消','C.closeModal()')+btn('预检并确认发布','C.confirmPublish()','primary'),true);
}
function confirmPublish(){const plan=state.publishPlan;if(!plan||plan.owner!==state.user?.account)return;const ids=chosenTargets(),files=plan.fromDraft?plan.files:plan.files.filter(m=>[...document.querySelectorAll('input[name="publish-file"]:checked')].some(el=>Number(el.value)===m.id));if(!ids.length||!files.length){toast('请选择目标和非空文件清单','error');return;}if(files.some(f=>f.compatibility==='unconfirmed')){toast('所选导入素材兼容性未确认，不能发布；请使用已核定素材演示','error');return;}const applyOrder=['video','image'].includes(plan.mode)&&Boolean(document.getElementById('publish-order')?.checked);if(plan.fromDraft){const d=state.devices.find(d=>d.id===plan.fromDraft);if(d.snapshotVersion!==plan.baseline){toast('设备配置已变化，请重新审阅草稿基线','error');return;}if(applyOrder&&files.length>(plan.mode==='video'?3:5)){toast('超过当前保守兼容槽位，请缩短草稿','error');return;}}
 const overlaps=ids.flatMap(id=>files.filter(m=>state.devices.find(d=>d.id===id).storedFiles.includes(m.name)).map(m=>`${state.devices.find(d=>d.id===id).name}：${m.name}`)),overwrite=Boolean(document.getElementById('publish-overwrite')?.checked);
 if(!plan.fromDraft&&overlaps.length&&!overwrite){modal('确认同名覆盖',`<p>以下文件已存在，可能覆盖不同内容。选择继续覆盖后再创建任务。</p><p>${overlaps.map(h).join('<br>')}</p>`,btn('返回选择',`C.publishModal(null,${JSON.stringify(ids)})`)+btn('明确覆盖并发布','C.acceptOverwrite()','danger'),true);state.publishSubmit={plan:cloneFlow(plan),ids,files:cloneFlow(files),applyOrder};return;}
 submitPublish(plan,ids,files,applyOrder,overwrite);
}
function submitPublish(plan,ids,files,applyOrder,overwrite){if(files.some(f=>f.compatibility==='unconfirmed')){toast('导入素材兼容性未确认，禁止发布','error');return;}const request={mode:plan.mode,files:cloneFlow(files),order:files.map(f=>f.name),applyOrder,overwrite};const result=authorizeWrite(ids);if(!result.ok){toast(result.message,'error');return;}const t=createTask('publish',`${applyOrder?'播放配置发布':'仅上传'} · ${ids.length} 台`,ids,['逐台预检','上传','应用配置','只读核验','本机登记'],'',{request});if(t){state.publishFromDraft=null;state.publishUploadOnly=false;closeModal();state.page='tasks';render();}}
function saveParams(){flowInit();if(!flowCanEdit())return;const d=device(),draft=paramDraft(d),values={brightness:Number(document.getElementById('brightness').value),volume:Number(document.getElementById('volume').value),speed:Number(document.getElementById('speed').value),interval:Number(document.getElementById('interval').value),subtitle:document.getElementById('subtitle').value};draft.values={...values};if(![values.brightness,values.volume].every(n=>Number.isInteger(n)&&n>=1&&n<=99)||![0,1,2].includes(values.speed)||!Number.isInteger(values.interval)||values.interval<1){toast('亮度/音量须为1—99整数，速度0/1/2，间隔正整数','error');return;}if(!values.subtitle.trim()||new TextEncoder().encode(values.subtitle).length>256){toast('当前演示能力拒绝空字幕，字幕上限256 UTF-8字节','error');return;}const changed=Object.fromEntries(Object.entries(values).filter(([k,v])=>v!==draft.base[k]));if(!Object.keys(changed).length){delete state.pendingParams;toast('参数没有变化，不创建任务');return;}if(d.snapshotVersion!==draft.baseline){toast('设备配置已变化，已保留草稿；请按新当前值重新审阅','error');draft.base=paramValues(d);draft.baseline=d.snapshotVersion;return;}state.pendingParams={id:d.id,owner:state.user.account,baseline:draft.baseline,values:changed,before:{...draft.base}};
 modal('确认变化字段',`<p>${h(d.name)} / ${h(d.sn)} · 只发送以下变化</p><table class="table"><thead><tr><th>字段</th><th>原值</th><th>目标值</th></tr></thead><tbody>${Object.entries(changed).map(([k,v])=>`<tr><td>${h(k)}</td><td>${h(draft.base[k])}</td><td>${h(v)}</td></tr>`).join('')}</tbody></table><p class="hint">字幕setstxt路线在本演示中模拟受理，无内容回读，不能标文字效果已核验。某字段失败会停止其后的写入。</p>`,btn('继续编辑','C.closeModal()')+btn('确认逐字段提交','C.confirmParams()','primary'),true);
}
function confirmParams(){const p=state.pendingParams;if(!p||p.owner!==state.user?.account)return;const d=state.devices.find(d=>d.id===p.id);if(d.snapshotVersion!==p.baseline){toast('基线已变化，请重新审阅','error');return;}const t=createTask('params','参数设置 · '+d.name,[d.id],['预检','逐字段发送','回读','本机登记'],'',{request:{values:p.values}});if(t){delete state.pendingParams;closeModal();state.page='tasks';render();}}
function saveNetwork(){flowInit();if(!flowCanEdit())return;const d=device(),p={ip:document.getElementById('net-ip').value.trim(),netmask:document.getElementById('net-mask').value.trim(),gateway:document.getElementById('net-gateway').value.trim(),dns:document.getElementById('net-dns').value.trim().split(',').map(v=>v.trim()).join(',')},error=validateNetwork(p)||networkConflict(d.id,p.ip);if(error){document.getElementById('network-validation').innerHTML=`<p class="field-error">${h(error)}</p>`;return;}
 if(!sameFlow(d.networkConfig,d.networkRuntime)||d.networkLock){toast('存在未确认改址，先继续只读核验，不创建第二次设置','error');return;}if(sameFlow(d.networkConfig,p)&&sameFlow(d.networkRuntime,p)){toast('config与runtime均无变化，不创建任务');return;}state.pendingNetwork={id:d.id,owner:state.user.account,baseline:d.snapshotVersion,network:p};modal('确认完整网络变更',`<p>${h(d.name)} / SN ${h(d.sn)} · 操作者 ${h(state.user.name)}</p><p>台账地址 ${h(d.ip)} → 目标访问地址 ${h(p.ip)}，端口/path沿用台账。</p><table class="table"><thead><tr><th>字段</th><th>旧值</th><th>目标值</th></tr></thead><tbody>${Object.keys(p).map(k=>`<tr><td>${k}</td><td>${h(d.networkRuntime[k]||'未设置')}</td><td>${h(p[k]||'未设置')}</td></tr>`).join('')}</tbody></table><p class="hint">目标未发现已知占用不保证无冲突。先保存prepared，再set_network；连接可能中断。新址同SN且config/runtime全部一致后才独立写入本机台账。旧址停用时序仍待固件确认。</p>`,btn('继续编辑','C.closeModal()')+btn('确认准备并提交','C.confirmNetwork()','primary'),true);
}
function confirmNetwork(){const p=state.pendingNetwork;if(!p||p.owner!==state.user?.account)return;const d=state.devices.find(d=>d.id===p.id);if(d.snapshotVersion!==p.baseline){toast('设备基线变化，请重新审阅完整配置','error');return;}const t=createTask('network','网络换址 · '+d.name,[d.id],['prepared','set_network受理','新址身份/config/runtime','本机台账'],'',{request:{network:p.network}});if(t){state.jobs[d.id]={taskId:t.id,old:d.ip,target:p.network.ip,config:cloneFlow(p.network),status:'running',stage:'prepared'};delete state.pendingNetwork;closeModal();state.page='tasks';render();}}
function verifyNetwork(id){
  const job=state.jobs[id];
  if(job){
    const t=visibleTasks().find(t=>t.id===job.taskId);
    if(!t){toast('当前账号不能访问此任务','error');return;}
    verifyTaskReadOnly(t);
    return;
  }
  const d=state.devices.find(x=>x.id===id);
  if(!d||!visibleDevices().some(x=>x.id===id)){toast('该终端不在当前授权范围','error');return;}
  if(!state.user||!state.service){toast('请先恢复会话和本机采集引擎','error');return;}
  // 若尚无外部变化上下文，先读取一次以捕获可信目标；已有上下文则不得先刷新抹掉目标
  if(!d.externalNetworkChange){
    readNetworkForPage(d,true);
    if(!d.networkConfig||!d.networkRuntime||sameFlow(d.networkConfig,d.networkRuntime)){
      toast('当前无 config≠runtime 差异，无需外部变化核验');
      render();
      return;
    }
    captureExternalNetworkChange(d);
  }
  verifyExternalNetworkChange(d);
}
function verifyTaskReadOnly(t){if(!state.user||!state.service||!taskOwned(t)){toast('请先恢复会话和本机采集引擎','error');return;}t.halted=false;t.epoch=state.sessionEpoch;t.writeStopped=true;for(const r of t.results){if(!visibleDevices().some(d=>d.id===r.id)||r.active||!r.sent||r.state==='cancelled')continue;r.active=true;state.flowActive++;verifyTarget(t,r,true);}render();}
function upgradeModal(ids=null){flowInit();if(!flowCanEdit())return;if(ids)state.selected=new Set(ids);const chosen=[...state.selected].filter(id=>visibleDevices().some(d=>d.id===id));if(!chosen.length){toast('请选择至少一台目标','error');return;}const pkg=packageMeta();state.upgradePlan={ids:chosen,owner:state.user.account,package:pkg,targetVersion:state.package,snapshots:chosen.map(id=>{const d=state.devices.find(d=>d.id===id);return{id,version:d.version,hardware:d.hardware,snapshotVersion:d.snapshotVersion};})};modal('逐台升级预检',`<p>${h(pkg.source)} · ${h(pkg.version)} · ${h(pkg.size)}<br>${h(pkg.integrity)}</p><table class="table"><thead><tr><th>设备 / SN</th><th>硬件</th><th>实测 → 目标版本</th><th>预检</th></tr></thead><tbody>${chosen.map(id=>{const d=state.devices.find(d=>d.id===id),why=d.online!=='online'?'设备不可达':upgradeReason(d,pkg,state.package);return `<tr><td>${h(d.name)}<small>${h(d.sn)}</small></td><td>${h(d.hardware||'未知')}</td><td>${h(d.version)} → ${h(state.package)}</td><td>${why?h(why):'<span class="badge green">演示元数据匹配</span>'}</td></tr>`;}).join('')}</tbody></table><p class="hint">每台不兼容或同版本目标保留跳过原因。空间信息真实契约待定，原型不编造可用容量。上传/pkg_upgrade/恢复核验/本机登记分别记录；受理响应丢失时不重发。</p>`,btn('取消','C.closeModal()')+btn('确认可执行目标并记录其余原因','C.confirmUpgrade()','primary'),true);}
function confirmUpgrade(){const p=state.upgradePlan;if(!p||p.owner!==state.user?.account)return;if(p.snapshots.some(s=>{const d=state.devices.find(d=>d.id===s.id);return !d||d.snapshotVersion!==s.snapshotVersion||d.version!==s.version||d.hardware!==s.hardware;})){toast('升级预检数据已变化，请重新审阅','error');return;}const t=createTask('upgrade','固件升级 '+p.targetVersion,p.ids,['包校验','upload_pkg','pkg_upgrade','恢复/版本核验','本机登记'],'',{request:{package:p.package,targetVersion:p.targetVersion}});if(t){closeModal();state.page='tasks';render();}}
function tasks(){flowInit();const all=visibleTasks(),filter=state.taskFilter||'all',shown=all.filter(t=>filter==='all'||filter==='running'?filter==='all'||t.status==='running':filter==='attention'?['uncertain','partial','failed'].includes(t.status)||t.results.some(r=>['pending','failed','conflict'].includes(r.platformSync)):t.status!=='running'),task=shown.find(t=>t.id===state.taskSelected)||shown[0];return head('任务中心','设备写任务全局最多2台并发，同台串行；本机台账写入与设备结果分别记录。',btn('刷新本机记录','C.refreshTask()','','refresh'))+`<div class="radio-strip" style="margin-bottom:16px">${[['all','全部'],['running','执行中'],['attention','需处理'],['ended','已结束']].map(([v,n])=>`<button class="${filter===v?'active':''}" onclick="C.taskFilter('${v}')">${n}</button>`).join('')}</div>${!task?'<section class="card"><div class="empty-state">当前账号 / 筛选暂无任务。任务只对原操作者及当前完整授权范围显示。</div></section>':`<div class="task-layout"><section class="card flush">${shown.map(t=>`<article class="task-card ${task.id===t.id?'active':''}" onclick="C.task(${t.id})"><div class="task-title"><strong>${h(t.title)}</strong><span class="spacer"></span>${badge(t.status,'task')}</div><p class="hint">${h(t.note)}</p><div class="meta"><span>#${t.id} · ${h(t.user)}</span><span>${t.time}</span></div></article>`).join('')}</section><section class="card"><div class="card-head"><div><h2>${h(task.title)}</h2><p>固定目标快照 · #${task.id} · ${h(task.createdAt)}</p></div>${badge(task.status,'task')}</div><p class="status-msg">${h(task.note)}</p><table class="table compact"><thead><tr><th>目标快照</th><th>设备结果 / 阶段</th><th>本机台账</th></tr></thead><tbody>${task.results.map(r=>`<tr><td>${h(r.snapshot.name)}<small>${h(r.snapshot.sn)} / ${h(r.snapshot.ip)}<br>起始版本 ${h(r.snapshot.version)}</small></td><td>${badge(r.state,'task')}<div class="hint">${h(r.networkPhase?networkPhaseLabels[r.networkPhase]:r.phase)} · ${h(r.message)}</div></td><td>${h(({not_required:'未进入写入',pending:'本机记录待保存',synced:'已写入',failed:'写入失败',conflict:'台账版本冲突'})[r.platformSync])}</td></tr>`).join('')}</tbody></table>${task.results.map(r=>`<details style="margin-top:15px"><summary>${h(r.snapshot.name)} · 前后值 / 逐步事实</summary>${task.kind==='network'?networkObservationsView(r):''}${Object.keys(r.fields).length?`<table class="table"><thead><tr><th>字段</th><th>原值 → 目标</th><th>实际 / 结果</th></tr></thead><tbody>${Object.entries(r.fields).map(([k,f])=>`<tr><td>${h(k)}</td><td>${h(f.before)} → ${h(f.target)}</td><td>${h(f.actual)} · ${h(f.state)}<small>${h(f.message)}</small></td></tr>`).join('')}</tbody></table>`:''}<pre style="white-space:pre-wrap;overflow-wrap:anywhere">${h(JSON.stringify({request:task.request,evidence:r.evidence,timeline:r.timeline},null,2))}</pre></details>`).join('')}<div class="form-footer"><span class="hint">核验只读；恢复不会重放设置、升级或重启。</span><span class="spacer"></span>${task.results.some(r=>r.sent&&!r.active)?btn('只读重新核验','C.verifyTask()','soft sm','refresh'):''}${task.results.some(r=>r.state==='queued'||r.state==='prechecking'&&!r.sent)?btn('取消未开始项','C.cancelQueued()','sm'):''}${task.results.some(r=>r.deviceResult==='verified'&&r.platformSync!=='synced')?btn('仅重试保存本机记录',`C.retryPlatform(${task.id})`,'sm'):''}</div></section></div>`}`;}
function firmware(){flowInit();const pkg=packageMeta();return head('软件包与升级','本机软件包库；适配信息未确认或硬件/版本未知不放行。',btn('导入本地软件包','C.importPackage()','','upload'))+`<div class="package-grid">${['V6.0.13','V6.0.12'].map(v=>`<article class="package-card ${state.package===v?'selected':''}"><span class="package-cover">PKG</span><div><h3>HL 多媒体终端 ${v}</h3><p>本机包库 · 36.2 MB<br>YS-MT6 / H2.1 · dev.cgi V1<br>最低起始版本V6.0.10</p><p class="hint">模拟完整性信息；无真实验签证据</p></div><input type="radio" name="package" ${state.package===v?'checked':''} onchange="C.package('${v}')" aria-label="选择升级包 ${v}"></article>`).join('')}</div><section class="card"><div class="card-head"><div><h2>逐台兼容性预检</h2><p>同版本跳过；硬件/版本未知、不兼容或降级禁止</p></div>${btn('审阅升级目标','C.upgradeModal()','primary','package')}</div><table class="table"><thead><tr><th><input type="checkbox" onchange="C.selectAll(this.checked)" aria-label="选择升级目标"></th><th>设备 / SN</th><th>硬件</th><th>当前版本</th><th>适配结果</th></tr></thead><tbody>${visibleDevices().map(d=>`<tr><td><input type="checkbox" ${state.selected.has(d.id)?'checked':''} onchange="C.selectDevice(${d.id},this.checked)" aria-label="升级 ${h(d.name)}"></td><td>${h(d.name)}<small>${h(d.sn)}</small></td><td>${h(d.hardware||'未知')}</td><td>${h(d.version)}</td><td>${h(d.online!=='online'?'不可达，跳过':upgradeReason(d,pkg,state.package)||'演示包适配匹配')}</td></tr>`).join('')}</tbody></table></section>${notice('upload_pkg只证明上传。只读核验读取同一SN与实际目标版本；版本不符保留实测值，不重刷。','amber')}`;}

function detailScreenshot(d){return `<div class="detail-layout"><section class="card"><div class="card-head"><div><h2>设备显示画面</h2><p>查看设备最近采集到的完整画面</p></div>${!readOnly()?btn('捕获新截图','C.capture()','primary','camera'):'<span class="readonly-label">最近已采集截图</span>'}</div>${d.captureError?`<div class="detail-error"><strong>本次截图获取失败</strong><div>仍展示上次采集画面，可稍后重试。</div><pre>HTTP 503\n{"message":"当前画面捕获失败"}</pre></div>`:''}${screenArt(true)}<div class="screen-caption"><span>${d.sn} · 采集于 今天 ${d.captureTime}</span><span>终端合成画面示意 · 1920 × 1080</span></div></section><section class="card" style="height:max-content"><div class="card-head"><h2>截图信息</h2></div><div class="kv-grid" style="grid-template-columns:1fr">${kv('来源终端',d.sn)}${kv('设备地址',d.ip)}${kv('采集时间','今天 '+d.captureTime)}${kv('画面格式','JPEG · 完整屏幕')}</div><div class="divider"></div><p class="hint">该画面为采集时的设备显示内容，不是实时视频流。设备休眠时保留实际捕获结果，不主动唤醒电梯。</p>${readOnly()?'<p class="hint" style="margin-top:16px">只读账号可查看已采集画面，不提供主动截图和导出入口。</p>':`<div style="margin-top:20px">${btn('保存截图','C.downloadScreenshot()','full','download')}</div>`}</section></div>`;}
function detailMaintenance(d){return `<div class="detail-layout"><section class="card"><div class="card-head"><h2>维护操作</h2><span class="tag">管理员 / 维护</span></div><div class="settings-row"><div><label>设备激活</label><p>设备激活与本机记录分别确认</p></div>${d.activated?'<span class="badge green">已激活</span>':btn('激活设备','C.maintenance(\'激活设备\')','soft')}</div><div class="settings-row"><div><label>校准设备时间</label><p>手动发起，读取页面不会自动校时</p></div>${btn('校准时间','C.maintenance(\'校准时间\')')}</div><div class="settings-row"><div><label>固件升级</label><p>当前 ${d.version}，恢复后核对版本</p></div>${btn('选择升级包','C.upgradeDevice()')}</div><div class="settings-row"><div><label>重启终端</label><p>会短时中断显示与连接，请确认现场情况</p></div>${btn('重启设备','C.maintenance(\'重启设备\')','danger')}</div></section><section class="card"><div class="card-head"><h2>最近维护记录</h2></div>${[...state.audit.filter(a=>a.target===d.sn).slice(0,4),{time:'10:42',user:'张工',action:'读取设备信息',result:'完成'},{time:'昨天',user:'李明',action:'素材发布并回读',result:'完成'}].map(a=>`<div class="audit-row"><time>${a.time}</time><div>${h(a.action)}<small>${a.user}</small></div><span class="muted small">${a.result}</span></div>`).join('')}</section></div>`;}
function media(){const ms=state.materials.filter(m=>state.mediaType==='all'||m.type===state.mediaType);return head('素材库','集中管理本机素材，按终端或分组逐台发布。',btn('导入本机文件','C.importMaterials()','','upload')+btn('创建发布任务','C.publishModal()','primary','plus'))+`<div class="card" style="margin-bottom:20px;padding:13px 18px"><div class="between"><div class="radio-strip">${[['all','全部素材'],['video','视频'],['image','图片'],['logo','Logo'],['text','字幕']].map(([v,t])=>`<button class="${state.mediaType===v?'active':''}" onclick="C.mediaType('${v}')">${t}</button>`).join('')}</div><span class="small muted">${ms.length} 个素材 · 仅存于本机设计演示</span></div></div><div class="media-grid">${ms.map(m=>`<article class="media-card"><div class="media-cover ${m.type==='video'?'city':m.type==='image'?'notice':m.type==='logo'?'logo':''}">${m.type==='video'?'<span class="play">▶</span>':m.type==='image'?'社区公告':m.type==='logo'?'HAI LIN':'文明乘梯 · 安全同行'}</div><div class="media-info"><strong>${h(m.name)}</strong><small>${m.size} · ${m.duration}</small><div class="between"><span class="tag">${({video:'视频',image:'图片',logo:'Logo',text:'字幕'})[m.type]}</span>${btn('发布到终端',`C.publishModal(${m.id})`,'text sm')}</div></div></article>`).join('')}</div><div class="notice" style="margin-top:22px">${I('info')}<div>发布会先上传素材，再设置播放列表并回读核验。Logo 与字幕更新需按设备要求确认重启；不会自动重启。</div></div>`;}

function logs(){return head('日志与操作记录','读取设备日志、保存到本机或归档到本机审计。',btn('归档所选日志','C.archiveLog()','','upload')+btn('保存日志','C.downloadLog()','primary','download'))+`<div class="grid2" style="grid-template-columns:280px 1fr"><section class="card flush"><div class="toolbar" style="padding:15px"><select style="width:100%" aria-label="日志来源终端" onchange="C.logDevice(this.value)">${visibleDevices().map(d=>`<option value="${d.id}" ${state.detailId===d.id?'selected':''}>${d.project} · ${d.name}</option>`).join('')}</select></div><div class="log-list">${['2026-10-27.log','2026-10-26.log','2026-10-25.log'].map(n=>`<button class="${state.logName===n?'active':''}" onclick="C.logName('${n}')"><span>${I('log')} ${n}</span><small>13.2 KB</small></button>`).join('')}</div><div style="padding:15px">${btn('刷新日志列表','C.refresh()','full sm','refresh')}</div></section><section class="card"><div class="card-head"><h2>${state.logName}</h2><span class="small muted">UTF-8 · 示例内容</span></div><div class="log-pane">[14:27:03] INFO   Device SN: ${device().sn}\n[14:27:03] INFO   HTTP service ready\n[14:27:04] INFO   Ethernet interface eth0 up\n[14:27:04] INFO   Address ${device().ip}\n[14:27:05] INFO   Playback initialized: video\n[14:27:05] INFO   Playlist: 城市生活.mp4, 安全乘梯.mp4\n[14:27:07] INFO   Elevator communication: ${device().comm}\n[14:27:08] INFO   Elevator sleep state: ${device().sleep}\n[14:27:13] INFO   Status query completed\n[14:27:18] INFO   Status query completed</div><p class="hint">设备日志与操作审计分别记录。读取成功后，归档失败不会改变设备日志读取结果。</p></section></div><section class="card flush" style="margin-top:20px"><div class="card-head"><h2>本次演示操作记录</h2><span class="muted small">逐条记录操作者与目标</span></div><table class="table compact"><thead><tr><th>时间</th><th>操作者</th><th>操作</th><th>目标</th><th>结果</th></tr></thead><tbody>${state.audit.slice(0,5).map(a=>`<tr><td>${a.time}</td><td>${a.user}</td><td>${a.action}</td><td>${h(a.target)}</td><td>${a.result}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">暂无新的操作记录</td></tr>'}</tbody></table></section>`;}
function admin(){const tab=state.adminTab;return head('账号与分组','角色决定操作能力，授权分组与单台授权决定可见终端。',tab==='groups'?btn('新增分组','C.addGroup()','primary','plus'):tab==='users'?btn('新增账号','C.addUser()','primary','plus'):'')+`<div class="tabs">${[['users','账号管理'],['groups','项目分组'],['permissions','角色权限']].map(([v,t])=>`<button class="${tab===v?'active':''}" onclick="C.adminTab('${v}')">${t}</button>`).join('')}</div>${notice('按当前约定，维护与管理员拥有相同操作能力，包括本页管理功能。所有角色均受授权分组及单台授权范围限制。')}${tab==='users'?`<section class="card flush"><table class="table"><thead><tr><th>姓名 / 账号</th><th>角色</th><th>授权终端范围</th><th>状态</th><th></th></tr></thead><tbody>${[...Object.values(accounts),...state.extraUsers].map(u=>`<tr><td><strong style="font-weight:550">${h(u.name)}</strong><small>${h(u.account)}</small></td><td><span class="user-card-role">${roleNames[u.role]}</span></td><td class="muted">${u.role==='viewer'?'花园中心、滨江雅苑部分终端':'全部授权分组'}</td><td>${badge('online')}</td><td>${btn('调整授权',`C.editUser('${h(u.account)}')`,'text sm')}</td></tr>`).join('')}</tbody></table><div class="permissions-caption">当前角色来自本机账号授权；正式登录页不提供自选角色。</div></section>`:tab==='groups'?`<section class="card flush"><table class="table"><thead><tr><th>项目分组</th><th>终端数量</th><th>分组说明</th><th></th></tr></thead><tbody>${[...new Set([...state.devices.map(d=>d.project),...state.extraGroups])].map(g=>`<tr><td>${I('folder')} ${g}</td><td>${state.devices.filter(d=>d.project===g).length} 台</td><td class="muted">按项目组织终端</td><td>${btn('重命名',`C.renameGroup('${g}')`,'text sm')}${btn('删除',`C.deleteGroup('${g}')`,'text sm')}</td></tr>`).join('')}</tbody></table></section>`:permissionTable()}<div class="role-note">${I('shield')}只读限制同时在界面和本机命令入口校验；隐藏按钮不能替代权限检查。</div>`;}
function permissionTable(){const rows=[['查看授权终端及当前设置',true,true,true],['刷新设备状态',true,true,true],['查看最近已采集截图',true,true,true],['主动截图、保存截图',true,true,false],['修改 IP、音量、亮度、字幕及播放设置',true,true,false],['上传、删除素材与批量发布',true,true,false],['激活、校时、升级、重启',true,true,false],['设备台账、账号、授权及分组管理',true,true,false],['本机设置与采集引擎管理',true,true,false]];return `<section class="card flush"><table class="table compact"><thead><tr><th>业务能力</th><th>管理员</th><th>维护</th><th>只读</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td>${r.slice(1).map(v=>`<td class="${v?'permission-yes':'permission-no'}">${v?'允许':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="permissions-caption">同一角色的不同账号也可拥有不同的终端授权范围。</div></section>`;}
function settings(){return head('本机设置','确认本机采集引擎、本机数据和应用运行方式。',btn('本机诊断','C.diagnostics()','','network'))+`<div class="grid2"><section class="card"><div class="card-head"><div class="settings-title">${I('network')}<h2>本机台账与账号</h2></div>${badge(state.platform?'online':'offline')}</div><div class="form-grid">${field('本机数据目录（演示）','platform-address','%LOCALAPPDATA%/Yeeshine/TerminalManager','text',readOnly()?'readonly':'')}</div><div class="settings-row"><div><label>当前账号</label><p>角色与可写范围由本机账号决定</p></div><span class="small muted">${state.user.account}</span></div><div class="settings-row"><div><label>本机缓存</label><p>按账号隔离，退出后清理会话</p></div><span class="badge blue">已启用</span></div>${!readOnly()?`<div class="form-footer">${btn('保存连接设置','C.saveConnection()','primary')}</div>`:''}</section><section class="card"><div class="card-head"><div class="settings-title">${I('device')}<h2>本机采集引擎</h2></div>${badge(state.service?'online':'offline')}</div><div class="settings-row"><div><label>采集范围</label><p>仅采集当前账号有权访问的终端</p></div><span class="small muted">${visibleDevices().length} 台</span></div><div class="settings-row"><div><label>状态读取周期</label><p>读取设备信息、网络和电梯状态</p></div><span class="small muted">5 秒</span></div><div class="settings-row"><div><label>窗口关闭后</label><p>保留托盘，继续采集和跟踪任务</p></div><span class="toggle on"></span></div><div class="settings-row"><div><label>开机自动启动</label><p>首期默认不启用</p></div><span class="toggle"></span></div>${!readOnly()?`<div class="form-footer">${btn(state.service?'重新启动服务':'启动服务','C.restartService()','','refresh')}${btn('退出应用并停止服务','C.exitApp()','danger')}</div>`:''}</section></div><section class="card" style="margin-top:20px"><div class="card-head"><h2>运行边界</h2><span class="tag">Windows 桌面</span></div><div class="grid3"><div><h3>宿主内采集</h3><p class="hint">采集引擎在业务宿主内运行；窗口进托盘不停止。只读取状态，不自动校时、激活、升级或改播放。</p></div><div><h3>离线显示</h3><p class="hint">本机库不可用时禁止改写台账；采集引擎停止时状态未知。不依赖业务后台。</p></div><div><h3>明确退出</h3><p class="hint">显式退出后停止本机服务；未确认完成的操作保留“结果待确认”，不重复发送。</p></div></div></section>`;}
function business(){return `<div class="biz"><div class="biz-hero"><div><span style="font-size:11px;letter-spacing:2px;color:#83a4ca">HAI LIN / WINDOWS TERMINAL MANAGER</span><h1 style="margin-top:13px">从授权登录，到逐台执行与核验</h1><p>一套终端管理工作台，三种角色，两条清晰链路。<br>V1.5 单机自包含：无业务后台；本机账号与台账；宿主内采集引擎。</p></div><small>业务设计 V1.5<br>2026.10.28<br>所有页面为可交互演示</small></div><div class="biz-section"><h2>01 系统职责与数据流</h2><p>UI 发起用户意图；业务宿主内采集引擎管理采集与任务；本机台账提供账号/范围/分组；视频机执行设备动作。</p><div class="architecture"><div class="arch-box"><h3>Windows 操作界面</h3><p>授权登录 / 终端列表 / 详情<br>参数、素材、网络、截图<br>任务逐台结果 / 服务状态</p></div><div class="arch-arrow">⇄</div><div class="arch-box primary"><h3>Rust 业务宿主（采集引擎）</h3><p>按当前账号二次校验操作权限<br>本机全台账只读采集 / 有限并发 / 任务编排<br>按账号范围展示采集结果 / 状态及结果事件</p></div><div class="arch-arrow">⇄</div><div class="arch-box"><h3>局域网视频机终端</h3><p>dev.cgi HTTP 本机接口<br>SN / 实际参数 / 通信及休眠<br>素材与播放 / 实际画面 / 升级</p></div></div><div class="backend-bridge">本机 SQLite 台账 ⇄ 业务宿主<br>本机账号 · 台账 / 分组 · 软件包 · 任务 / 审计（单机自包含）</div><div class="biz-note">本机服务使用原生 HTTP 访问设备；旧手机 uni.postMessage / equActionRes 桥接退出新链路。采集/任务在同一 Rust 业务宿主内（tokio + device-core）；无额外采集进程、无命名管道。窗口进托盘，显式退出停引擎；不是默认 Windows 系统服务。</div></div><div class="biz-section"><h2>02 用户、角色与设备范围</h2><p>采集随应用运行，覆盖本机台账的全部终端，与是否登录无关；登录只决定能看什么、能做什么。管理员与维护是管理账号，固定可查看和管理全部终端（含本机账号管理）；只读账号只能查看授权分组（不含子分组）与单台终端，不能修改。</p>${permissionTable()}<div class="flow"><div class="flow-node green"><strong>01</strong>应用启动<br>采集运行中（全台账）</div><div class="flow-node"><strong>02</strong>本机账号 + 密码登录</div><div class="flow-node"><strong>03</strong>载入角色<br>管理账号全台账 / 只读按授权范围</div><div class="flow-node"><strong>04</strong>显示“你可查看的终端 N 台”</div><div class="flow-node"><strong>05</strong>按权限展示与执行</div></div><div class="biz-note">审阅工具条仅演示。正式应用角色来自本机账号；只读账号所有写 command 拒绝。管理员与维护均为管理账号，授权范围固定为全台账（含本机账号管理）；须始终至少保留一个启用的管理账号。只读账号不能修改设备或账号。本机角色不限制其他 LAN 客户端直连未鉴权设备接口。</div></div><div class="biz-cols"><div class="biz-section"><h2>03 三类状态分别表达</h2><ul class="scope-list"><li><strong>设备可达性：</strong>本机通信层根据响应与连续超时判定；收到 HTTP 错误仍表明服务可达，只是查询失败。</li><li><strong>电梯通信：</strong>由终端采集，online / offline / unknown；不能用 HTTP 可达代替。</li><li><strong>电梯休眠：</strong>awake / sleeping / unknown；休眠不等于屏幕黑屏或设备离线。</li><li><strong>采集失效：</strong>当前值改为未知，历史数据带时间保留；不将缓存当实时。采样周期与失效规则由设备方明确。</li></ul></div><div class="biz-section"><h2>04 服务生命周期与离线</h2><ul class="scope-list"><li>应用启动 → 采集引擎就绪，按本机全台账只读采集（未登录、锁定或换账号都不影响采集）→ 本机账号登录 → 按账号显示：管理账号全台账，只读账号按授权范围。</li><li>窗口最小化或关闭 → 托盘运行，采集和已发起任务继续；托盘只显示“采集运行中”，不显示终端数量或明细。</li><li>本机库不可用 → 禁止改写台账；采集引擎停止 → 状态未知，崩溃恢复先核验。</li><li>采集引擎中断 → 状态未知，进行中任务待确认；恢复先回读核验。</li><li>明确退出 → 停止采集引擎；取消未开始项，不宣称已经撤销设备已受理动作。</li></ul></div></div><div class="biz-section"><h2>05 单台、多台、多组使用同一发布流程</h2><p>每台终端独立校验文件和结果，不用首台结果代表整批。</p><div class="flow"><div class="flow-node"><strong>锁定目标</strong>分组 / SN<br>保存目标快照</div><div class="flow-node"><strong>校验</strong>权限、设备可达<br>格式、容量、文件</div><div class="flow-node"><strong>执行</strong>逐台上传素材<br>设置播放模式与顺序</div><div class="flow-node"><strong>核验</strong>回读文件与参数<br>必要时查看实际画面</div><div class="flow-node green"><strong>逐台记账</strong>成功 / 失败<br>待确认 / 本机记录待保存</div></div><div class="biz-note">Logo、字幕若需要重启，另行提示并确认；不因文件上传成功就提示实际显示已更新。队列取消只取消未开始项，固件上传中止与残留清理不作为已支持能力。</div></div><div class="biz-section"><h2>06 静态 IP 修改与换址确认</h2><div class="flow"><div class="flow-node"><strong>修改前</strong>读取 SN 和当前网络<br>保留旧 IP</div><div class="flow-node"><strong>提交</strong>POST set_network<br>校验合法静态 IPv4</div><div class="flow-node amber"><strong>HTTP 200</strong>message 表示已受理<br>尚未标记完成</div><div class="flow-node"><strong>换址后</strong>使用新 IP 读取<br>核对同一 SN 与运行值</div><div class="flow-node green"><strong>确认完成</strong>更新本机台账地址<br>保存旧址及操作记录</div></div><div class="biz-note">无响应先保留“结果待确认”，不能自动重复提交。SN 仅用于识别与台账关联，不是身份凭据；非法接入与写 SN 授权需要另行定义。当前只考虑静态 IPv4，不包含 DHCP。</div></div><div class="biz-section"><h2>07 固件升级与激活分别确认设备和本机记录</h2><div class="flow"><div class="flow-node"><strong>选择</strong>授权目标 + 适配软件包</div><div class="flow-node"><strong>上传</strong>完成包接收<br>不等于升级完成</div><div class="flow-node"><strong>受理与恢复</strong>触发升级<br>等待设备服务恢复</div><div class="flow-node"><strong>核验</strong>重新读取 SN<br>实际软件版本匹配</div><div class="flow-node green"><strong>本机登记</strong>保存逐台结果<br>失败则本机记录待保存</div></div><div class="biz-note">激活以设备回读为准；本机台账另行记录。允许“设备已激活、本机记录待保存”，不把本机保存失败误标为设备激活失败。</div></div><div class="biz-cols"><div class="biz-section"><h2>08 首期业务范围</h2><ul class="scope-list"><li>终端台账、分组、授权列表、当前状态与参数。</li><li>视频 / 图片上传、播放模式与顺序、亮度音量、图片间隔、字幕及速度、Logo、手动校时。</li><li>静态 IP、实际设备截图、激活、设备日志、固件升级及重启。</li><li>单台与多台任务、逐台核验、操作审计、服务状态、异常与缓存只读。</li></ul></div><div class="biz-section"><h2>09 后续能力与协议边界</h2><ul class="scope-list"><li>手册历史能力：播放起止时段 / 重复次数、字幕颜色 / 次数 / 暂停、存储卡初始化。</li><li>当前不提供 DHCP、任意目录上传、硬件上传中止清理的可用入口。</li><li>这些能力需另行确认固件接口，不能用删除全部素材代替格式化。</li><li>旧 file/filename、inter/interval、settime 方法及上传格式差异由设备适配层核定。</li></ul></div></div><div class="source-note">参考依据：电梯多媒体终端 6.0 管理系统简易操作说明书（PDF 物理第 4–10 页）；IOT_SHEB / IOT_SHEB_GRP 台账与分组；ElevatorIot-App 账号登录和设备通信（历史参考，V1.5 不依赖）；旧平台 MBL_IoT_Ctrl / Files / SysOp / Active 页面；本轮 dev.cgi 网络、状态与截图讨论。<br>设计与示例数据用于业务确认，不代表真实设备已通过播放、网卡切换、状态采集或固件升级验收。</div></div>`;}
function trayScreen(){return `<div class="window">${titlebar()}<div class="tray-screen"><section class="tray-card"><div class="tray-icon">${I(state.exited?'power':'device')}</div><h1>${state.exited?'应用已退出':'已最小化到系统托盘'}</h1><p>${state.exited?'本机采集引擎已停止。进行中的未确认结果已保留，重新启动后需核验。':'窗口已隐藏，采集运行中。采集与是否登录无关，继续覆盖本机台账的全部终端并跟踪已发起任务；这里不显示终端数量或明细。'}</p><div class="flex" style="justify-content:center">${btn(state.exited?'重新启动演示':'恢复主窗口','C.restore()','primary')}${!state.exited?btn('退出应用','C.exitApp()','danger'):''}</div></section></div></div>`;}
function render(){reviewbar();const app=document.getElementById('app');app.innerHTML=state.business?business():state.minimized||state.exited?trayScreen():!state.user?login():shell(({overview,devices,detail,media,tasks,firmware,logs,admin,settings}[state.page]||overview)());}

function requireDeviceOnline(d){if(!d||d.online!=='online'){toast('终端当前不可访问，请先检查连接','error');return false;}return true;}
function targetChoices(ids=null){return `<div class="target-list">${visibleDevices().map(d=>`<label class="target-row"><input type="checkbox" name="publish-target" value="${d.id}" ${(ids||[...state.selected]).includes(d.id)?'checked':''} ${d.online!=='online'?'disabled':''}><span>${d.project} · ${d.name}<small class="mono">${d.sn} / ${d.ip}</small></span>${badge(effectiveOnline(d))}</label>`).join('')}</div>`;}
function chosenTargets(){return [...document.querySelectorAll('input[name="publish-target"]:checked')].map(i=>Number(i.value)).filter(id=>visibleDevices().some(d=>d.id===id&&d.online==='online'));}
// All writes pass this gate again immediately before each simulated request.
function authorizeWrite(ids=[],{local=false,task=null}={}){
 if(!state.user)return {ok:false,error:'NOT_AUTHENTICATED',message:'请先登录'};
 if(readOnly())return {ok:false,error:'PERMISSION_DENIED',message:'只读账号不能执行修改操作'};
 if(ids.some(id=>!visibleDevices().some(d=>d.id===id)))return {ok:false,error:'OUT_OF_SCOPE',message:'目标已不在当前账号授权范围'};
 if(task&&(task.owner!==state.user.account||task.epoch!==(state.sessionEpoch||0)))return {ok:false,error:'SESSION_CHANGED',message:'会话已变化，恢复后只允许先核验'};
 if(!local&&!state.platform)return {ok:false,error:'LOCAL_STORE_UNAVAILABLE',message:'本机台账库不可用，不能改写台账或发送新的设备写请求'};
 if(!local&&!state.service)return {ok:false,error:'SERVICE_OFFLINE',message:'采集引擎未运行'};
 return {ok:true};
}
function flowInit(){
 state.fixtureCapabilities ||= {defaultSerialNumbers:['00000000','0000000000000000','YS00000000'],screenshotSupportedHardware:['YS-MT6 / H2.1']};state.flowTimers ||= new Set();state.flowScenario ||= 'success';state.flowDrafts ||= {};state.paramDrafts ||= {};state.requestLog ||= [];state.flowActive ||= 0;state.sessionEpoch ||= 0;state.nextTaskId ||= 1000;state.facts ||= {};
 state.devices.forEach(d=>{d.subtitle ??= '文明乘梯 安全同行 欢迎来到花园中心';d.hardware ??= d.id===6?'YS-MT5 / H1.0':d.id===8?null:'YS-MT6 / H2.1';d.platformActivated ??= d.activated;d.snapshotVersion ??= 1;d.registryVersion ??= 1;d.registered ??= true;d.networkConfig ||= networkValues(d);d.networkRuntime ||= networkValues(d);d.imagePlaylist ||= ['社区公告.jpg'];d.logoFile ??= 'logo.png';d.textFile ??= '1.txt';
 if(!state.facts[d.id])state.facts[d.id]={sn:d.sn,version:d.version,hardware:d.hardware,mode:d.mode,playlist:[...d.playlist],imagePlaylist:[...d.imagePlaylist],storedFiles:[...d.storedFiles],brightness:d.brightness,volume:d.volume,speed:d.speed,interval:d.interval,subtitle:d.subtitle,networkConfig:{...d.networkConfig},networkRuntime:{...d.networkRuntime},logoFile:d.logoFile,textFile:d.textFile,activated:d.activated};});
}
function flowLater(fn,ms){const id=setTimeout(()=>{state.flowTimers.delete(id);fn();},ms);state.flowTimers.add(id);return id;}
const cloneFlow=value=>JSON.parse(JSON.stringify(value));
function networkValues(d){return {ip:d.ip,netmask:d.netmask,gateway:d.gateway||'',dns:Array.isArray(d.dns)?d.dns.join(','):d.dns||''};}
function sameFlow(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function draftKey(id){return `${state.user?.account||''}:${id}`;}
function mediaDraft(d){flowInit();const key=draftKey(d.id);return state.flowDrafts[key] ||= {deviceId:d.id,baseline:d.snapshotVersion,base:{mode:d.mode,video:[...d.playlist],image:[...d.imagePlaylist]},mode:d.mode,video:[...d.playlist],image:[...d.imagePlaylist]};}
function paramDraft(d){flowInit();return state.paramDrafts[draftKey(d.id)] ||= {deviceId:d.id,baseline:d.snapshotVersion,base:paramValues(d),values:paramValues(d)};}
function paramValues(d){return Object.fromEntries(['brightness','volume','speed','interval','subtitle'].map(k=>[k,d[k]]));}
function flowCanEdit(){if(!state.user||readOnly()){toast('当前账号没有编辑权限','error');return false;}return true;}
function flowChanged(draft){return !sameFlow(draft.base,{mode:draft.mode,video:draft.video,image:draft.image});}
function networkWire(value){return {ip:value.ip,netmask:value.netmask,gateway:value.gateway||'',dns:Array.isArray(value.dns)?[...value.dns]:(value.dns||'').split(',').map(v=>v.trim()).filter(Boolean)};}
function networkComparable(value){const p=networkWire(value);return {...p,dns:p.dns.join(',')};}
function networkMatches(a,b){return sameFlow(networkComparable(a),networkComparable(b));}
const networkPhaseLabels={prepared:'变更记录已准备',accepted_not_applied:'已受理未生效 · 旧址观察',applying_or_uncertain:'生效中 / 结果待确认 · 新旧并列',verified:'新址配置已核验'};
function recordNetworkObservation(t,r,role){const f=state.facts[r.id],endpoint=role==='old'?r.snapshot.ip:t.request.network.ip,reachable=role==='old'?f.networkAccess?.old!==false:f.networkAccess?.next===true||endpoint===r.snapshot.ip&&f.networkAccess?.old!==false;const observedSN=!reachable?null:role==='old'&&t.scenario==='old_wrong_sn'?'YS-OTHER-OLD':role==='new'&&t.scenario==='wrong_sn'&&!f.networkReviewApplied?'YS-OTHER-NEW':f.sn;const observation={endpoint,address:endpoint,port:r.snapshot.port||80,path:r.snapshot.path||'/elevtor/dev.cgi',addressRole:role,observedAt:new Date().toISOString(),expectedSN:r.snapshot.sn,observedSN,transport:reachable?'responded':'timeout',identity:!reachable?'unchecked':observedSN===r.snapshot.sn?'match':'mismatch',config:reachable?networkWire(f.networkConfig):null,runtime:reachable?networkWire(f.networkRuntime):null};r.evidence.networkObservations ||= [];r.evidence.networkObservations.push(observation);if(observation.identity==='match'){const d=state.devices.find(d=>d.id===r.id);const config=networkComparable(observation.config),runtime=networkComparable(observation.runtime);if(!sameFlow(d.networkConfig,config)||!sameFlow(d.networkRuntime,runtime))d.snapshotVersion++;d.networkConfig=config;d.networkRuntime=runtime;d.networkObservedAt=observation.observedAt;d.networkObservedEndpoint=endpoint;d.networkObservedSN=observedSN;d.networkObservation=cloneFlow(observation);}return observation;}
// This is a simulated firmware event. Read-only verification never calls it.
function applyFirmwareNetwork(t,r,reviewer=false){const f=state.facts[r.id];f.networkRuntime=networkComparable(t.request.network);f.networkConfig=t.scenario==='config_mismatch'&&!reviewer?networkComparable(r.snapshot.config):networkComparable(t.request.network);f.networkAccess={old:!['quick_switch'].includes(t.scenario),next:true};if(reviewer)f.networkReviewApplied=true;r.evidence.firmwareEvents ||= [];r.evidence.firmwareEvents.push({at:new Date().toISOString(),source:reviewer?'review_tool':'simulated_firmware',message:'固件模拟运行配置切换；没有发送第二次set_network'});}
function networkObservationsView(r){const rows=r?.evidence.networkObservations||[];return `<div class="flow-steps">${['prepared','accepted_not_applied','applying_or_uncertain','verified'].map((phase,i)=>`<span class="flow-step ${r?.networkPhase===phase?'active':''}">${i+1}. ${networkPhaseLabels[phase]}</span>`).join('')}</div><details ${r?.networkPhase!=='verified'?'open':''}><summary>完整地址观察（${rows.length}条）</summary><div class="table-scroll"><table class="table compact"><thead><tr><th>采集地址 / 时间</th><th>SN / 身份</th><th>config / runtime</th></tr></thead><tbody>${rows.map(o=>`<tr><td>${o.addressRole==='old'?'旧址':'新址'} ${h(o.endpoint)}:${o.port}<small>${h(o.path)}<br>${h(o.observedAt)}</small></td><td>${h(o.observedSN||'未取得')}<small>${h(o.transport)} / ${h(o.identity)}${o.identity==='mismatch'?' · 此观察不采信':''}</small></td><td><small>config ${h(o.config?JSON.stringify(o.config):'未取得')}<br>runtime ${h(o.runtime?JSON.stringify(o.runtime):'未取得')}</small></td></tr>`).join('')||'<tr><td colspan="3">尚无设备观察</td></tr>'}</tbody></table></div></details>`;}
function verifyNetworkTarget(t,r,manual=false){if(!canReadTask(t,r))return finishTarget(t,r,r.sent?'uncertain':'cancelled','当前会话不能继续只读核验');if(!r.sent&&r.failure)return finishTarget(t,r,'failed',r.failure);r.state='verifying';r.phase='verifying';const read=(role,done)=>{if(!canReadTask(t,r))return finishTarget(t,r,'uncertain','会话或服务停止；未继续后续地址读取');r.endpoint=role==='old'?r.snapshot.ip:t.request.network.ip;recordRequest(t,r,`${role==='old'?'旧址':'新址'} get_network + info`,false,{manual});flowLater(()=>{if(!canReadTask(t,r))return finishTarget(t,r,'uncertain','会话或服务停止；保留已有观察');done(recordNetworkObservation(t,r,role));},400);};
 read('old',old=>read('new',next=>{const q=t.request.network;r.evidence.config=next.config;r.evidence.runtime=next.runtime;r.evidence.observedSN=next.observedSN;r.evidence.expectedSN=r.snapshot.sn;r.evidence.oldAddress=old.transport==='timeout'?'本次旧址不可达；不推断固件永久停用':old.identity==='mismatch'?'旧址返回另一SN，该观察不采信':'旧址仍响应，独立保留观察，不重发设置';const verified=next.identity==='match'&&networkMatches(next.config,q)&&networkMatches(next.runtime,q);let message;
  if(verified){r.networkPhase='verified';r.deviceResult='verified';r.evidence.identity='match';message='新址同一SN，config/runtime的IP、掩码、网关与DNS均符合目标；旧址观察单列';r.message=message;if(r.platformSync==='synced')return finishTarget(t,r,'success',message+'；本机台账已更新，本次核验未发写请求');if(r.platformSync==='not_required')r.platformSync='pending';if(manual||!state.platform||t.writeStopped)return finishTarget(t,r,'success',message+'；本机台账仍为旧址，待确认采纳新地址');return syncPlatform(t,r);}
  if(next.identity==='mismatch'){r.networkPhase='applying_or_uncertain';r.deviceResult='failed';r.evidence.identity='mismatch';return finishTarget(t,r,'failed','新址返回另一SN：未采信config/runtime，不更新主台账，不重复set_network');}
  const oldAccepted=old.identity==='match'&&networkMatches(old.config,q)&&!networkMatches(old.runtime,q);r.networkPhase=oldAccepted&&(next.transport==='timeout'||next.endpoint===old.endpoint)?'accepted_not_applied':'applying_or_uncertain';r.deviceResult='uncertain';r.platformSync='not_required';message=r.networkPhase==='accepted_not_applied'?'旧址同SN：保存配置已是目标，运行配置仍旧；已受理未生效，继续只读观察':next.identity==='match'&&networkMatches(next.runtime,q)?'新址runtime吻合，config尚不符合目标；不能认定换址完成':'新旧地址观察并列，尚未取得新址同SN及全部配置一致的证据';if(t.scenario==='acceptance_lost')message+='；set_network响应丢失，禁止重发';finishTarget(t,r,'uncertain',message);
 }));render();}
function activationBlockReason(d){const defaults=state.fixtureCapabilities?.defaultSerialNumbers||['00000000','0000000000000000','YS00000000'];if(!d.sn?.trim())return 'Windows激活前必须取得非空SN；禁止自动写SN';if(defaults.includes(d.sn.trim()))return '设备仍为默认SN，须完成受控身份登记后再激活；本入口不发送write_serial';if(d.registered!==true)return 'Windows激活要求设备已在授权台账登记';return null;}

function flowScenarioControl(){return `<label class="review-switch">流程场景 <select aria-label="流程审阅场景" onchange="C.flowScenario(this.value)">${Object.entries({success:'正常链路·先观察旧址再切换',accepted_not_applied:'已受理未生效（旧址）',applying_or_uncertain:'生效中·新旧并列',quick_switch:'快速切换·旧址不可达',old_wrong_sn:'旧址另一SN不采信',upload_failure:'上传明确失败',readback_mismatch:'回读不符 / 版本未变',pending:'持续待确认',wrong_sn:'新址 / 恢复为另一SN',platform_failure:'设备成功·登记失败',registry_conflict:'台账登记冲突',prepared_failure:'prepared保存失败',field_failure:'第三字段失败',target_conflict:'目标IP另一SN',config_mismatch:'runtime吻合·config不符',download_failure:'包下载失败',acceptance_lost:'受理响应丢失'}).map(([v,n])=>`<option value="${v}" ${(state.flowScenario||'success')===v?'selected':''}>${n}</option>`).join('')}</select></label>${state.user&&visibleTasks().some(t=>t.kind==='network'&&t.results.some(r=>r.sent&&r.networkPhase!=='verified'))?`<button class="review-action" onclick="C.simulateNetworkApply(${(visibleTasks().find(t=>t.kind==='network'&&t.results.some(r=>r.sent&&r.networkPhase!=='verified'))).id})">模拟固件完成切换</button>`:''}`;}
function taskOwned(t){return Boolean(state.user&&t.owner===state.user.account);}
function visibleTasks(){return state.tasks.filter(t=>taskOwned(t)&&t.targets.every(id=>visibleDevices().some(d=>d.id===id)));}
function taskResult(t,id){return t.results.find(r=>r.id===id);}
function taskSummary(t){
 const counts={success:0,failed:0,uncertain:0,cancelled:0,queued:0,active:0};t.results.forEach(r=>{if(r.state in counts)counts[r.state]++;else counts.active++;});
 t.status=counts.active||counts.queued?'running':counts.uncertain?'uncertain':counts.success===t.results.length?'success':counts.failed===t.results.length?'failed':'partial';
 t.progress=Math.round((counts.success+counts.failed+counts.uncertain+counts.cancelled)/Math.max(1,t.results.length)*100);
 t.note=`已核验 ${counts.success} · 失败 ${counts.failed} · 待确认 ${counts.uncertain} · 取消 ${counts.cancelled} · 排队 ${counts.queued} · 处理中 ${counts.active}`;
 const job=t.kind==='network'&&state.jobs[t.targets[0]];if(job){const r=t.results[0];job.status=r.state;job.stage=r.phase;job.phase=r.networkPhase;job.message=r.message;job.platformSync=r.platformSync;}
 return counts;
}
function requestMethodForAction(action){
  // 明确接口映射（D04/D27 等）；不扩大 JSON 头；其余遗留 GET 保持不变
  const map={
    device_activate:'POST',
    pkg_upgrade:'GET',
    set_network:'POST',
    set_video_order:'POST',
    set_image_order:'POST',
    set_image_interval:'POST',
    del_file:'POST'
  };
  if(map[action])return map[action];
  if(/^upload/.test(action))return 'POST';
  return 'GET';
}
function recordRequest(t,r,action,write,data){const jsonBody=['set_network','set_video_order','set_image_order'].includes(action);const entry={method:requestMethodForAction(action),headers:jsonBody?{'Content-Type':'application/json'}:{},at:new Date().toISOString(),taskId:t.id,owner:t.owner,deviceId:r.id,sn:r.snapshot.sn,endpoint:r.endpoint||r.snapshot.ip,action,write,data:cloneFlow(data||{})};state.requestLog.push(entry);r.timeline.push({time:entry.at,endpoint:entry.endpoint,action,write,response:'等待响应'});return entry;}
function canReadTask(t,r){return Boolean(state.user&&state.service&&t.owner===state.user.account&&visibleDevices().some(d=>d.id===r.id)&&!t.halted);}
function finishTarget(t,r,kind,message){r.state=kind;r.message=message;r.phase=kind;r.completedAt=new Date().toISOString();if(r.active){r.active=false;state.flowActive=Math.max(0,state.flowActive-1);}taskSummary(t);render();pumpTasks();}
function stopJobs(reason='session'){
 flowInit();for(const id of state.timers)clearTimeout(id);state.timers.clear();
 if(reason!=='platform')state.sessionEpoch++;
 for(const t of state.tasks){t.writeStopped=true;if(reason!=='platform')t.halted=true;
  for(const r of t.results){if(r.state==='queued'||r.state==='prechecking'&&!r.sent){r.state='cancelled';r.phase='cancelled';r.message='会话、采集引擎或本机库变化，尚未发送的目标已取消';if(r.active){r.active=false;state.flowActive=Math.max(0,state.flowActive-1);}}
   else if(r.active&&reason!=='platform'){r.state=r.sent?'uncertain':'cancelled';r.message=r.sent?'请求已发出，结果待重新认证后只读核验':'未发送，已取消';if(r.active){r.active=false;state.flowActive=Math.max(0,state.flowActive-1);}}}
  taskSummary(t);
 }
}
function createTask(kind,title,ids,stages,note,spec={}){
 flowInit();const auth=authorizeWrite(ids);if(!auth.ok){toast(auth.message,'error');return null;}if(!ids.length)return null;
 const t={id:++state.nextTaskId,kind,title,targets:[...new Set(ids)],targetSnapshots:[],stages,stage:0,status:'running',progress:0,note,user:state.user.name,owner:state.user.account,epoch:state.sessionEpoch,time:dateTime(),createdAt:new Date().toISOString(),request:cloneFlow(spec.request||{}),scenario:state.flowScenario,results:[]};
 for(const id of t.targets){const d=state.devices.find(d=>d.id===id),snapshot={id,name:d.name,sn:d.sn,ip:d.ip,port:d.port||80,path:d.path||'/elevtor/dev.cgi',version:d.version,hardware:d.hardware,snapshotVersion:d.snapshotVersion,registryVersion:d.registryVersion,config:cloneFlow(d.networkConfig),runtime:cloneFlow(d.networkRuntime),before:paramValues(d),mode:d.mode,playlist:[...d.playlist],imagePlaylist:[...d.imagePlaylist]};t.targetSnapshots.push(snapshot);t.results.push({id,snapshot,state:'queued',phase:'queued',message:'等待执行槽位',deviceResult:'not_started',platformSync:'not_required',fields:{},evidence:{},timeline:[],sent:false,step:0});}
 if(kind==='network')state.jobs[t.targets[0]]={taskId:t.id,old:t.targetSnapshots[0].ip,target:t.request.network.ip,config:cloneFlow(t.request.network),status:'running',stage:'prepared',phase:'prepared'};state.tasks.unshift(t);state.audit.unshift({time:t.time,user:t.user,owner:t.owner,action:t.title,target:t.targetSnapshots.map(d=>d.sn).join('、'),taskId:t.id,result:'任务已创建'});state.taskSelected=t.id;state.mutationCount++;pumpTasks();return t;
}
function pumpTasks(){flowInit();if(!state.user||!state.service)return;
 for(const t of [...state.tasks].reverse()){if(t.halted||t.writeStopped||!taskOwned(t))continue;
  for(const r of t.results){if(state.flowActive>=2)return;if(r.state!=='queued')continue;
   if(state.tasks.some(other=>other.results.some(x=>x!==r&&x.id===r.id&&x.active)))continue;
   r.active=true;state.flowActive++;r.state='prechecking';r.phase='prechecking';r.message='复核账号授权、SN、设备版本与操作锁';
   flowLater(()=>{if(r.state==='cancelled')return;if(!canReadTask(t,r))return finishTarget(t,r,r.sent?'uncertain':'cancelled','会话或授权已变化');const auth=authorizeWrite([r.id],{task:t});if(!auth.ok)return finishTarget(t,r,'cancelled',auth.message);const d=state.devices.find(d=>d.id===r.id),fact=state.facts[r.id];recordRequest(t,r,'info 预检',false,{});if(d.online!=='online')return finishTarget(t,r,'failed','设备不可达，零写请求');if(fact.sn!==r.snapshot.sn||d.identity==='mismatch')return finishTarget(t,r,'failed','SN身份不一致，禁止写入');if(!ensureNetworkObservationForWrite(d))return finishTarget(t,r,'failed','写前网络观察不可用或不新鲜，已阻止写入');if(d.externalNetworkChange&&d.externalNetworkChange.status!=='registered'){captureExternalNetworkChange(d);return finishTarget(t,r,'failed','存在外部变化待确认，禁止冲突写，先只读核验');}if(d.networkLock||(d.networkConfig&&d.networkRuntime&&!sameFlow(d.networkConfig,d.networkRuntime))){if(d.networkConfig&&d.networkRuntime&&!sameFlow(d.networkConfig,d.networkRuntime))captureExternalNetworkChange(d);return finishTarget(t,r,'failed',d.networkLock?'该设备改址登记未解决，常规新写任务锁定':'观察到config与runtime不一致，禁止冲突写，先只读核验');}if(t.kind==='maintenance'&&t.request.action==='激活设备'){const why=activationBlockReason(d);if(why)return finishTarget(t,r,'failed',why);}if(t.kind==='publish'&&(t.request.files||[]).some(f=>f.compatibility==='unconfirmed'))return finishTarget(t,r,'failed','导入素材兼容性未确认，未发送设备写请求');if(t.kind==='upgrade'){const why=upgradeReason(d,t.request.package,t.request.targetVersion);if(why)return finishTarget(t,r,'failed',why);}if(t.kind==='network'){const why=validateNetwork(t.request.network)||networkConflict(r.id,t.request.network.ip,t.scenario);if(why)return finishTarget(t,r,'failed',why);if(state.jobs[r.id]?.taskId&&state.jobs[r.id].taskId!==t.id&&['running','uncertain'].includes(state.jobs[r.id].status))return finishTarget(t,r,'failed','已有活动网络变更，先只读核验');}
   r.steps=buildFlowSteps(t,r);executeStep(t,r);},350);
  }
 }
}
function executeStep(t,r){
 if(!r.active)return;if(r.step>=r.steps.length)return verifyTarget(t,r,false);
 const step=r.steps[r.step];if(!canReadTask(t,r))return finishTarget(t,r,r.sent?'uncertain':'cancelled','会话或服务中断，恢复后只读核验');
 if(step.write){const auth=authorizeWrite([r.id],{task:t});if(t.writeStopped||!auth.ok){r.interrupted=true;r.evidence.stoppedBefore=step.action;return verifyTarget(t,r,false);}}
 r.phase=step.action;r.state=step.write?'running':'prechecking';r.message=step.label||step.action;if(step.local)r.timeline.push({time:new Date().toISOString(),action:step.action,write:false,response:'本机等待，无设备请求'});else recordRequest(t,r,step.action,step.write,step.data||t.request);if(step.write)r.sent=true;render();
 flowLater(()=>{const fact=state.facts[r.id];const fail=step.failure?.();if(fail){r.timeline.at(-1).response=fail;if(step.field)r.fields[step.field]={state:'failed',before:r.snapshot.before[step.field],target:t.request.values[step.field],actual:fact[step.field],message:fail};r.interrupted=true;r.failure=fail;return verifyTarget(t,r,false);}step.apply?.(fact);r.timeline.at(-1).response='模拟响应已收到';r.step++;if(t.halted||!canReadTask(t,r))return finishTarget(t,r,r.sent?'uncertain':'cancelled','已记录迟到响应，未发送后续请求；重新认证后先只读核验');executeStep(t,r);},650);
}
function buildFlowSteps(t,r){const q=t.request,scenario=t.scenario;
 if(t.kind==='network')return [
 {action:'本地prepared',label:'保存prepared记录并锁定台账版本',write:false,local:true,failure:()=>scenario==='prepared_failure'?'prepared记录保存失败：未发送set_network':null,apply(){r.networkPhase='prepared';r.evidence.prepared={id:`prepared-${t.id}`,registryVersion:r.snapshot.registryVersion,source:'local_store'};}},
 {action:'set_network',label:'提交静态配置；HTTP200仅受理，运行配置尚未切换',write:true,data:networkWire(q.network),apply(f){r.deviceResult='accepted';r.networkPhase='accepted_not_applied';const d=state.devices.find(d=>d.id===r.id);d.networkLock=true;d.pendingNetworkTarget=q.network.ip;r.endpoint=r.snapshot.ip;f.networkConfig=networkComparable(q.network);f.networkAccess={old:!['quick_switch','pending'].includes(scenario),next:scenario==='applying_or_uncertain'};r.evidence.accepted=scenario==='acceptance_lost'?'response_lost':'HTTP 200 set network success';}},
 {action:'旧址 get_network + info',label:'优先旧址只读观察并核对SN；旧址失败仍继续新址',write:false,apply(){recordNetworkObservation(t,r,'old');}},
 {action:'本机等待固件异步切换（无请求）',local:true,write:false,apply(){if(!['accepted_not_applied','applying_or_uncertain','pending','acceptance_lost'].includes(scenario))applyFirmwareNetwork(t,r);}}
 ];
 if(t.kind==='upgrade')return [{action:'校验本机包',write:false,failure:()=>scenario==='download_failure'?'升级包下载 / 完整性校验失败':null,apply(){r.evidence.packageVerified='仅模拟元数据校验；未声明签名验签';}},{action:'upload_pkg',write:true,failure:()=>scenario==='upload_failure'?'upload_pkg明确失败，未调用pkg_upgrade':null,apply(){r.evidence.packageUploaded=true;r.deviceResult='uploaded';}},{action:'pkg_upgrade',write:true,apply(f){r.deviceResult='accepted';r.evidence.upgradeAccepted=scenario==='acceptance_lost'?'响应丢失，是否受理未知':'HTTP 200仅受理';if(!['pending','readback_mismatch','acceptance_lost'].includes(scenario))f.version=q.targetVersion;}},{action:'等待设备恢复',write:false,apply(){r.evidence.recovery=scenario==='pending'?'观察窗口结束仍不可达':'已收到恢复响应';}}];
 if(t.kind==='params')return Object.entries(q.values||{}).map(([key,value],i)=>({action:({brightness:'setlum',volume:'setvol',speed:'setspeed',interval:'set_image_interval',subtitle:'setstxt'})[key],field:key,write:true,data:{[key]:value},failure:()=>scenario==='field_failure'&&i===2?'该字段明确返回HTTP 500；后续字段未发送':null,apply(f){r.deviceResult='accepted';r.fields[key]={state:'accepted',before:r.snapshot.before[key],target:value};if(scenario!=='readback_mismatch'||i!==0)f[key]=value;}}));
 if(t.kind==='publish'){const steps=[];for(const file of q.files||[]){if(!state.facts[r.id].storedFiles.includes(file.name)||q.overwrite)steps.push({action:({video:'upload_video',image:'upload_image',logo:'upload_logo',text:'upload_txt'})[file.type],write:true,data:{name:file.name,size:file.size},failure:()=>scenario==='upload_failure'?'上传明确失败：后续列表和模式未发送':null,apply(f){if(!f.storedFiles.includes(file.name))f.storedFiles.push(file.name);if(file.type==='logo')f.logoFile=file.name;if(file.type==='text')f.textFile=file.name;r.deviceResult='uploaded';r.evidence.files ||= [];r.evidence.files.push({name:file.name,size:file.size,proof:'名称/大小模拟核对；无hash回读'});}});}
  if(q.applyOrder){steps.push({action:q.mode==='image'?'set_image_order':'set_video_order',write:true,data:q.mode==='image'?{imageOrder:q.order}:{videoOrder:q.order},apply(f){r.deviceResult='accepted';if(scenario!=='readback_mismatch')f[q.mode==='image'?'imagePlaylist':'playlist']=[...q.order];}});steps.push({action:q.mode==='image'?'display_image':'display_video',write:true,apply(f){if(scenario!=='readback_mismatch')f.mode=q.mode;}});}return steps;
 }
 if(t.kind==='delete')return [{action:'del_file',write:true,data:{filename:q.name},failure:()=>fileReferenced(state.facts[r.id],q.name)?'素材仍被生效配置引用，禁止删除':null,apply(f){f.storedFiles=f.storedFiles.filter(n=>n!==q.name);r.deviceResult='accepted';}}];
 return [{action:({'激活设备':'device_activate','校准时间':'settime','重启设备':'reboot'})[q.action]||'不支持的维护动作',write:true,data:q.action==='校准时间'?{targetTime:t.createdAt}:{},apply(f){r.deviceResult='accepted';if(q.action==='激活设备')f.activated=true;r.evidence.accepted='HTTP 200仅受理';}},{action:'等待恢复',write:false}];
}
function syncFactCache(d,f){let changed=false;for(const k of ['mode','playlist','imagePlaylist','storedFiles','brightness','volume','speed','interval','subtitle','networkConfig','networkRuntime','logoFile','textFile','activated','version']){if(!sameFlow(d[k],f[k]))changed=true;d[k]=cloneFlow(f[k]);}if(changed)d.snapshotVersion++;}
function verifyTarget(t,r,manual=false){
 if(t.kind==='network')return verifyNetworkTarget(t,r,manual);
 if(!canReadTask(t,r))return finishTarget(t,r,r.sent?'uncertain':'cancelled','当前没有执行只读核验的会话与范围');r.phase='verifying';r.state='verifying';recordRequest(t,r,'info 回读',false,{manual});render();
 flowLater(()=>{if(!canReadTask(t,r))return finishTarget(t,r,'uncertain','核验过程中会话或授权变化；结果保留');const d=state.devices.find(d=>d.id===r.id),f=state.facts[r.id],q=t.request;r.evidence.observedAt=new Date().toISOString();r.evidence.observedSN=t.scenario==='wrong_sn'?'YS-OTHER-DEVICE':f.sn;r.evidence.expectedSN=r.snapshot.sn;
  if(t.scenario==='pending'||t.scenario==='acceptance_lost'){r.evidence.observation='观察窗口结束，未得到可用的身份与目标结果';return finishTarget(t,r,'uncertain','结果持续待确认；重复核验未改变实际设备事实');}
  if(r.evidence.observedSN!==r.snapshot.sn){r.evidence.identity='mismatch';return finishTarget(t,r,'failed','目标地址 / 恢复设备SN不符：未更新缓存与本机台账');}r.evidence.identity='match';
  if(!r.sent&&r.failure)return finishTarget(t,r,'failed',r.failure);syncFactCache(d,f);
  let ok=true,uncertain=false,message='同一SN，实际配置已模拟回读一致';
  if(t.kind==='upgrade'){r.evidence.actualVersion=f.version;r.evidence.targetVersion=q.targetVersion;ok=f.version===q.targetVersion&&Boolean(r.evidence.upgradeAccepted);message=ok?'恢复后同一SN、实测版本与目标一致':`实测版本 ${f.version}，目标 ${q.targetVersion}；不重放升级`;if(r.interrupted){uncertain=true;message='包已传输，后续升级未执行；先核验并重新审阅剩余步骤';}}
  else if(t.kind==='params'){for(const [k,v]of Object.entries(q.values||{})){const existing=r.fields[k];if(!existing){r.fields[k]={state:'not_sent',before:r.snapshot.before[k],target:v,actual:f[k],message:'前序失败或中断，未发送'};ok=false;}else if(existing.state==='failed'){ok=false;}else{const match=sameFlow(f[k],v);r.fields[k]={...existing,actual:k==='subtitle'?'无已证实内容回读字段':f[k],state:k==='subtitle'?'uncertain':match?'success':'failed',message:k==='subtitle'?'setstxt请求已返回；文字内容与画面待确认':match?'实际值一致':'实际值不符'};if(k==='subtitle')uncertain=true;else if(!match)ok=false;}}message=r.failure||(!ok?'部分字段失败 / 未发送，保留各字段目标与实测结果':uncertain?'参数已回读；字幕内容和画面仍待确认':'所有变化字段已回读一致');}
  else if(t.kind==='publish'){ok=(q.files||[]).every(x=>f.storedFiles.includes(x.name))&&(!q.applyOrder||(f.mode===q.mode&&sameFlow(f[q.mode==='image'?'imagePlaylist':'playlist'],q.order)));uncertain=(q.files||[]).some(x=>['logo','text'].includes(x.type));message=r.failure||(!ok?'素材传输 / 播放配置未确认，保留已完成步骤':uncertain?'专用文件已上传，名称/大小已核对；显示生效待协议与画面确认':q.applyOrder?'模式和有序列表已核验；不等于完整视频画面验收':'仅上传完成，未改变播放模式或顺序');if(r.interrupted){ok=false;uncertain=true;message='部分步骤完成，后续写入未执行；仅保留文件和配置观察';}}
  else if(t.kind==='delete'){ok=!f.storedFiles.includes(q.name);message=ok?'设备文件清单已确认删除':r.failure||'文件仍存在';}
  else if(t.kind==='maintenance'){if(q.action==='激活设备'){r.evidence.actualActive=f.activated;ok=f.activated===true;message=ok?'设备active已回读为true，本机记录独立':'设备active未符合目标';}else if(q.action==='校准时间'){uncertain=true;r.evidence.targetTime=t.createdAt;r.evidence.timeReadback='未取得可确认时间/时区的设备字段';message='校时请求已返回，设备时间未核验；不自动再次校时';}else if(q.action==='重启设备'){uncertain=true;r.evidence.recovery='同一SN已恢复可达';r.evidence.bootId='固件未提供';message='同一SN恢复可达；缺少bootId/uptime，重启事实未证实';}else{ok=false;message='未定义的维护动作，不能认定完成';}}else{ok=false;message='未定义的任务类型';}
  if(r.failure){ok=false;uncertain=false;message=r.failure;}r.deviceResult=ok&&!uncertain?'verified':uncertain?'uncertain':'failed';
  if(uncertain)return finishTarget(t,r,'uncertain',message);if(!ok)return finishTarget(t,r,'failed',message);
  r.message=message;if(r.platformSync==='synced')return finishTarget(t,r,'success',message+'；本机台账已写入，本次只读核验未重复登记');if(r.platformSync==='not_required')r.platformSync='pending';if(!state.platform||t.writeStopped){r.platformSync='pending';return finishTarget(t,r,'success',message+'；设备已核验，本机记录待保存');}syncPlatform(t,r);
 },600);
}
function syncPlatform(t,r){if(!state.user||!state.platform||!state.service||!taskOwned(t)||!visibleDevices().some(d=>d.id===r.id)){r.platformSync='pending';return finishTarget(t,r,'success','设备已核验，本机记录待保存');}recordRequest(t,r,t.kind==='network'?'本机台账登记（换址）':t.kind==='upgrade'?'本机升级结果登记':'本机操作审计登记',true,{source:'local_store'});
 flowLater(()=>{if(!canReadTask(t,r)||!state.platform){r.platformSync='pending';return finishTarget(t,r,'success','设备已核验，本机记录待保存');}const scenario=t.platformRetryScenario||t.scenario;const d=state.devices.find(d=>d.id===r.id),casConflict=t.kind==='network'&&(!r.evidence.prepared||d.registryVersion!==r.evidence.prepared.registryVersion);r.platformSync=scenario==='platform_failure'?'failed':scenario==='registry_conflict'||casConflict?'conflict':'synced';if(casConflict)r.evidence.registryConflict={expected:r.evidence.prepared?.registryVersion,actual:d.registryVersion};if(t.kind==='maintenance'&&t.request.action==='激活设备')d.platformActivated=r.platformSync==='synced';if(t.kind==='network'&&r.platformSync==='synced'){Object.assign(d,networkComparable(t.request.network));d.networkLock=false;d.registryVersion++;delete d.pendingNetworkTarget;}finishTarget(t,r,'success',r.platformSync==='synced'?r.message+'；本机台账已写入':r.message+'；本机'+(r.platformSync==='conflict'?'台账版本冲突':'写入失败')+'，未重发设备动作');},400);
}
function updateTask(t,stage,progress,note){if(!t||t.halted)return;t.stage=stage;t.note=note;taskSummary(t);render();}
function completeTask(t){if(t){taskSummary(t);render();}}
function ipv4(value){return typeof value==='string'&&/^\d{1,3}(\.\d{1,3}){3}$/.test(value)&&value.split('.').every(v=>Number(v)<=255&&String(Number(v))===v);}
function ipNumber(ip){return ip.split('.').reduce((a,n)=>(a*256+Number(n))>>>0,0)>>>0;}
function validateNetwork(p){if(!p||!ipv4(p.ip))return 'IP：请输入合法IPv4地址';if(!ipv4(p.netmask))return '掩码：请输入合法IPv4地址';const mask=ipNumber(p.netmask),inverse=(~mask)>>>0;if(mask===0||((inverse&(inverse+1))>>>0)!==0)return '掩码必须连续';if(inverse<3)return '首期不支持/31、/32点对点网段';const ip=ipNumber(p.ip),host=(ip&inverse)>>>0,first=Number(p.ip.split('.')[0]);if(first===0||first===127||first>=224||host===0||host===inverse)return 'IP必须是常规子网有效主机地址';if(p.gateway){if(!ipv4(p.gateway))return '网关：请输入合法IPv4地址';const gw=ipNumber(p.gateway),gh=(gw&inverse)>>>0,gfirst=Number(p.gateway.split('.')[0]);if(((gw&mask)>>>0)!==((ip&mask)>>>0)||gh===0||gh===inverse||gw===ip||gfirst===0||gfirst===127||gfirst>=224)return '网关必须是同子网另一有效主机地址，不能为网络/广播地址';}const dns=Array.isArray(p.dns)?p.dns:(p.dns||'').split(',').map(v=>v.trim()).filter(Boolean);if(dns.length>2||dns.some(v=>!ipv4(v)||Number(v.split('.')[0])===0||Number(v.split('.')[0])===127||Number(v.split('.')[0])>=224))return 'DNS最多两个有效IPv4地址，使用英文逗号分隔';if(typeof p.dns==='string'&&p.dns&&p.dns.split(',').some(v=>!v.trim()))return 'DNS列表不能含空项';return null;}
function networkConflict(id,ip,scenario=state.flowScenario){if(state.devices.some(d=>d.id!==id&&d.ip===ip))return '目标地址已被本机台账中其他终端占用，禁止提交';if(scenario==='target_conflict')return '对目标地址的有界探测返回另一SN，禁止提交';return null;}
function fileReferenced(d,name){return [...(d.playlist||[]),...(d.imagePlaylist||[]),d.logoFile,d.textFile].includes(name);}
function upgradeReason(d,pkg,target){if(!pkg||!pkg.hardware?.length||!pkg.minVersion)return '包适配元数据缺失，禁止升级';if(!d.hardware)return '硬件信息未知，禁止升级';if(!pkg.hardware.includes(d.hardware))return `硬件不兼容：${d.hardware}`;if(!/^V\d+\.\d+\.\d+$/.test(d.version))return '实测版本未知，禁止升级';const compare=(a,b)=>{const x=a.slice(1).split('.').map(Number),y=b.slice(1).split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};if(compare(d.version,target)===0)return '同版本默认跳过';if(compare(d.version,target)>0)return '首期不支持降级';if(compare(d.version,pkg.minVersion)<0)return '当前版本不满足升级路径';return null;}
function packageMeta(version=state.package){return {id:'demo-'+version,version,hardware:['YS-MT6 / H2.1'],minVersion:'V6.0.10',protocol:'dev.cgi V1',source:'本机软件包库',size:'36.2 MB',integrity:'模拟包完整性校验，未声明真实验签'};}

function screenshotCapability(d){return Boolean(d&&d.screenshotSupported!==false&&(d.screenshotSupported===true||(state.fixtureCapabilities?.screenshotSupportedHardware||['YS-MT6 / H2.1']).includes(d.hardware)));}
function capture(){const d=device();if(!screenshotCapability(d)){toast('该型号截图能力未定稿，禁用主动截图；仍可查看历史图','error');return;}if(!requireDeviceOnline(d))return;mutate('主动截图',{sn:d.sn},()=>{if(state.screenshotFailure){d.captureError=true;toast('当前画面捕获失败，保留上次截图','error');}else{d.captureError=false;d.captureTime=dateTime();toast('已模拟获取设备当前完整画面','success');}render();});}
function download(name,text,mime='text/plain;charset=utf-8'){const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function confirmSimple(title,body,fn){modal(title,`<p>${body}</p>`,btn('取消','C.closeModal()')+btn('确认',`C.runSimple()`,'primary'));state.simpleCallback=fn;}
const C = {
  state,dispatchMutation,visibleDevices,closeModal,
  nav(page){if(readOnly()&&!['overview','devices','detail','settings'].includes(page)){toast('只读账号没有该页面的操作权限','error');return;}state.page=page;render();},
  reviewRole(role){stopJobs();closeModal();state.reviewRole=role;state.user={...accounts[role]};state.page='overview';state.detailTab='overview';state.selected.clear();state.search='';state.group='all';state.minimized=false;state.exited=false;state.loginError='';render();toast('已切换到'+roleNames[role]+'审阅账号');},
  login(){const account=document.getElementById('login-account').value.trim(),password=document.getElementById('login-password').value;if(!account||!password){state.loginError='请输入账号和密码';render();return;}const user=Object.values(accounts).find(u=>u.account===account);if(!user){state.loginError='演示账号不存在，请使用下方已授权账号入口';render();return;}this.loginAs(user.role);},
  loginAs(role){if(!state.platform){state.loginError='本机台账库不可用，无法登录。请在审阅工具条恢复本机库。';render();return;}state.reviewRole=role;state.user={...accounts[role]};state.loginError='';state.page='overview';state.selected.clear();render();},
  logout(){stopJobs();closeModal();state.user=null;state.selected.clear();state.search='';state.group='all';state.detailTab='overview';state.pendingNetwork=null;state.pendingParams=null;state.imported=[];state.taskSelected=null;render();toast('已退出登录，当前账号会话已清理');},
  reset(){stopJobs();closeModal();state.user=null;state.reviewRole='maint';state.page='overview';state.business=false;state.minimized=false;state.exited=false;state.platform=true;state.service=true;state.devices=initialDevices();state.materials=baseMaterials.map(m=>({...m}));state.tasks=[];state.jobs={};state.audit=[];state.extraUsers=[];state.extraGroups=[];state.selected.clear();state.loginError='';state.search='';state.statusFilter='all';state.group='all';state.mutationCount=0;render();},
  togglePlatform(offline){state.platform=!offline;render();toast(offline?'本机台账库已模拟不可用：禁止改写台账与新的设备写操作':'本机台账库已恢复',offline?'':'success');},
  toggleService(stopped){if(stopped)stopJobs();state.service=!stopped;render();toast(stopped?'采集服务已停止，当前状态显示未知':'采集引擎已恢复，可重新读取状态',stopped?'':'success');},
  captureScenario(fail){state.screenshotFailure=fail;reviewbar();},
  business(){state.business=!state.business;render();},
  tray(){state.minimized=true;closeModal();render();},
  restore(){if(state.exited){state.service=true;state.exited=false;}state.minimized=false;render();},
  exitApp(){modal('退出应用并停止采集引擎',`<p>退出后将停止本机采集。未开始项停止执行；已被设备受理但尚未核验的操作保留为“结果待确认”。</p>`,btn('继续运行','C.closeModal()')+btn('退出应用','C.confirmExit()','danger'));},
  confirmExit(){stopJobs();state.service=false;state.exited=true;state.minimized=false;closeModal();render();},
  group(g){state.group=g;render();},
  search(value){state.search=value;const pos=document.activeElement?.selectionStart;render();const el=document.querySelector('input[aria-label="搜索终端"]');if(el){el.focus();el.setSelectionRange(pos,pos);}},
  filterStatus(v){state.statusFilter=v;render();},
  selectDevice(id,checked){if(readOnly())return;checked?state.selected.add(id):state.selected.delete(id);render();},
  selectAll(checked,onlineOnly=false){if(readOnly())return;const ds=state.page==='devices'?filteredDevices():visibleDevices();ds.filter(d=>!onlineOnly||d.online==='online').forEach(d=>checked?state.selected.add(d.id):state.selected.delete(d.id));render();},
  clearSelection(){state.selected.clear();render();},
  openDevice(id){if(!visibleDevices().some(d=>d.id===id)){toast('该终端不在当前授权范围','error');return;}state.detailId=id;state.detailTab='overview';state.page='detail';render();},
  detailTab(tab){if(readOnly()&&tab==='maintenance'){toast('只读账号没有维护权限','error');return;}state.detailTab=tab;if(tab==='network')readNetworkForPage(device());render();},
  refresh(){if(!state.service){toast('采集引擎未运行，无法取得新状态','error');return;}render();toast('已刷新授权终端的读取结果','success');},
  addDevice(){if(readOnly())return;modal('添加终端到台账',`<p>输入设备地址读取 SN 后，再保存到当前授权分组。不会自动激活设备。</p><div class="form-grid">${field('终端名称','add-name','新终端')}${field('设备 IP','add-ip','192.168.1.80')}<div class="field"><label for="add-group">项目分组</label><select id="add-group">${[...new Set(state.devices.map(d=>d.project))].map(g=>`<option>${g}</option>`).join('')}</select></div>${field('设备 SN（模拟读取结果）','add-sn','YS20260009')}</div>`,btn('取消','C.closeModal()')+btn('读取并保存台账','C.confirmAddDevice()','primary'));},
  confirmAddDevice(){const name=document.getElementById('add-name').value.trim(),ip=document.getElementById('add-ip').value.trim(),sn=document.getElementById('add-sn').value.trim(),project=document.getElementById('add-group').value;if(!name||!ipv4(ip)||!sn){toast('请填写名称、合法 IP 与 SN','error');return;}if(state.devices.some(d=>d.sn===sn)){toast('该 SN 已存在于台账，请核对设备身份','error');return;}mutate('新增设备台账',{sn},()=>{state.devices.push({...initialDevices()[0],id:Date.now(),name,ip,sn,project,location:'待完善',activated:false});closeModal();render();toast('已读取 SN 并模拟保存台账，设备未自动激活','success');});},
  mediaType(v){state.mediaType=v;render();},
  importMaterials(){if(readOnly())return;modal('导入本机素材',`<p>选择本机文件加入素材库；此演示只读取文件名与大小，不上传真实设备。</p><label class="upload-zone" style="display:block">${I('upload')}<div>点击选择视频、图片、Logo 或 TXT 文件</div><div class="hint">支持多选</div><input type="file" id="import-files" multiple accept="video/*,image/*,.txt" onchange="C.filesSelected(this.files)"></label><div id="import-summary" class="hint" style="margin-top:13px">尚未选择文件</div>`,btn('取消','C.closeModal()')+btn('导入素材库','C.confirmImport()','primary'));},
  filesSelected(files){state.imported=[...files].map(f=>({name:f.name,size:f.size,type:f.type}));document.getElementById('import-summary').textContent=state.imported.map(f=>f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB').join('；')||'尚未选择文件';},
  confirmImport(){if(!state.imported.length){toast('请先选择本机文件','error');return;}mutate('导入素材',{name:state.imported.length+' 个文件'},()=>{state.imported.forEach((f,i)=>state.materials.unshift({id:Date.now()+i,name:f.name,type:f.type.startsWith('video')?'video':f.type.startsWith('image')?'image':'text',size:(f.size/1024/1024).toFixed(2)+' MB',duration:'本机导入',date:'今天'}));state.imported=[];closeModal();render();toast('素材已加入本机演示库','success');});},
  publishModal,confirmPublish,
  demoPublish(){state.selected=new Set([1,2,3]);publishModal();},
  uploadToDevice(){publishModal(null,[device().id]);},
  publishCurrentPlaylist(){publishModal(null,[device().id]);},
  mode(mode){if(readOnly())return;const d=device();if(!requireDeviceOnline(d))return;mutate('切换播放模式',{sn:d.sn},()=>{d.mode=mode;render();toast('播放模式已模拟回读确认','success');});},
  moveTrack(i,delta){if(readOnly())return;const d=device(),j=i+delta;if(j<0||j>=d.playlist.length)return;mutate('调整播放顺序草稿',{sn:d.sn},()=>{[d.playlist[i],d.playlist[j]]=[d.playlist[j],d.playlist[i]];render();toast('已调整播放列表草稿，发布后应用到终端');});},
  deleteFile(name){if(!requireDeviceOnline(device()))return;confirmSimple('确认删除设备素材',`将从 ${device().name} 删除 ${h(name)}。执行后重新读取该设备素材列表。`,()=>mutate('删除设备素材',{sn:device().sn},()=>{device().playlist=device().playlist.filter(n=>n!==name);device().storedFiles=device().storedFiles.filter(n=>n!==name);toast('已模拟删除并重新读取素材列表','success');render();}));},
  saveParams,confirmParams,saveNetwork,confirmNetwork,verifyNetwork,reviewExternalPlatformSync,confirmExternalPlatformSync,capture,
  downloadScreenshot(){if(readOnly()){toast('只读账号不提供截图导出','error');return;}const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#173e62"/><rect width="300" height="540" fill="#0b1c2d"/><text x="90" y="285" fill="white" font-size="100" font-family="sans-serif">12</text><text x="420" y="240" fill="white" font-size="36" font-family="sans-serif">终端画面示意</text><text x="420" y="300" fill="#9ec2e8" font-size="24" font-family="sans-serif">${device().sn}</text></svg>`;download(device().sn+'-画面示意.svg',svg,'image/svg+xml');toast('已保存本地画面示意；真实产品下载设备 JPEG');},
  maintenance(action){const d=device();if(!requireDeviceOnline(d))return;confirmSimple('确认'+action,`目标终端 ${d.name}（${d.sn}）。${action==='重启设备'?'重启会暂时中断显示和网络，恢复后核对同一 SN。':action==='激活设备'?'先确认设备激活，再单独写入本机记录。':'手动校准设备时间，完成后回读确认。'}`,()=>mutate(action,{sn:d.sn},()=>{if(action==='激活设备')d.activated=true;const t=createTask('maintenance',action+' · '+d.name,[d.id],['用户确认','设备受理','恢复核验'],'请求已明确发起，等待设备处理。');state.page='tasks';render();later(()=>updateTask(t,1,50,'设备已受理，等待核验实际结果。'),700);later(()=>completeTask(t,{message:action==='激活设备'?'设备激活与本机记录均完成':'已恢复并读取同一 SN，结果已核验'}),2700);}));},
  runSimple(){closeModal();const cb=state.simpleCallback;state.simpleCallback=null;if(cb)cb();},
  upgradeDevice(){state.selected=new Set([device().id]);state.page='firmware';render();},
  package(v){state.package=v;render();},upgradeModal,confirmUpgrade,
  importPackage(){modal('导入固件包',`<p>选择本地升级包后，需核对适用硬件、版本与来源，再加入软件包列表。</p>${field('版本名称','pkg-version','V6.0.14')}${field('包文件（设计示例）','pkg-file','ys-mt6-v6.0.14.pkg')}<p class="hint">本原型不执行或上传任何固件文件。</p>`,btn('取消','C.closeModal()')+btn('确认导入','C.confirmImportPackage()','primary'));},
  confirmImportPackage(){const version=document.getElementById('pkg-version').value.trim();if(!version){toast('请填写版本名称','error');return;}mutate('导入固件包',{name:version},()=>{state.package=version;closeModal();toast('已记录示例软件包版本，可在升级确认中查看','success');render();});},
  task(id){state.taskSelected=id;render();},
  refreshTask(){if(!state.service){toast('请先恢复采集引擎','error');return;}render();toast('已刷新本机任务记录');},
  verifyTask(){if(!state.service){toast('请先恢复采集引擎','error');return;}const t=state.tasks.find(t=>t.id===state.taskSelected)||state.tasks[0];if(t){t.status='running';t.results.forEach(r=>{if(r.state==='uncertain')r.state='running';});completeTask(t,{message:'重新读取设备，结果已确认'});if(t.kind==='upgrade')t.targets.forEach(id=>{const d=state.devices.find(d=>d.id===id);if(d&&d.online==='online')d.version=t.targetVersion||state.package;});}},
  cancelQueued(){const t=state.tasks.find(t=>t.id===state.taskSelected)||state.tasks[0];confirmSimple('取消尚未开始的目标',`只取消未开始项。已经被设备受理的动作不能据此撤销，会继续等待结果核验。`,()=>mutate('取消待执行项',{name:t?.title},()=>toast('当前任务目标已开始，没有未开始项可取消')));},
  batchParams(){if(!state.selected.size){toast('请先选择终端');return;}modal('批量设置音量',`<p>对已选 ${state.selected.size} 台终端逐台设置，离线设备保留失败原因。</p>${field('音量（1—99）','batch-volume',35,'number','min="1" max="99"')}`,btn('取消','C.closeModal()')+btn('确认设置','C.confirmBatchParams()','primary'));},
  confirmBatchParams(){const volume=Number(document.getElementById('batch-volume').value);if(!Number.isInteger(volume)||volume<1||volume>99){toast('音量须为 1—99 的整数','error');return;}const ids=[...state.selected];mutate('批量设置音量',{name:ids.length+' 台终端'},()=>{const t=createTask('params','批量设置音量',[...ids],['校验目标','设置音量','回读核验'],'逐台校验目标与授权。');closeModal();state.page='tasks';render();later(()=>updateTask(t,1,60,'分别设置每台可达终端。'),600);later(()=>{ids.forEach(id=>{const d=state.devices.find(d=>d.id===id);if(d.online==='online')d.volume=volume;});completeTask(t);},2200);});},
  logDevice(id){state.detailId=Number(id);render();},logName(v){state.logName=v;render();},
  downloadLog(){if(readOnly()){toast('只读账号不提供日志导出','error');return;}download(state.logName,`[演示日志]\nDevice SN: ${device().sn}\nIP: ${device().ip}\nCommunication: ${device().comm}\nSleep: ${device().sleep}`);toast('已保存本机示例日志','success');},
  archiveLog(){mutate('归档日志',{sn:device().sn},()=>toast('设备日志已读取，并保存到本机','success'));},
  adminTab(v){state.adminTab=v;render();},
  addUser(){modal('新增授权账号',`<p>在本机创建账号并分配角色、终端范围。</p><div class="form-grid">${field('姓名','new-user-name','')}${field('账号','new-user-account','')}<div class="field"><label for="new-user-role">角色</label><select id="new-user-role">${Object.entries(roleNames).map(([r,n])=>`<option value="${r}">${n}</option>`).join('')}</select></div></div>`,btn('取消','C.closeModal()')+btn('创建账号','C.confirmAddUser()','primary'));},
  confirmAddUser(){const name=document.getElementById('new-user-name').value.trim(),account=document.getElementById('new-user-account').value.trim(),role=document.getElementById('new-user-role').value;if(!name||!account){toast('请填写姓名和账号','error');return;}if(!/^[a-zA-Z][a-zA-Z0-9._-]{2,31}$/.test(account)){toast('账号须以字母开头，仅含字母、数字、点、短横线或下划线','error');return;}if([...Object.values(accounts),...state.extraUsers].some(u=>u.account===account)){toast('账号已存在','error');return;}mutate('新增授权账号',{name},()=>{state.extraUsers.push({name,account,role});closeModal();render();toast('示例账号已创建','success');});},
  editUser(account){const u=[...Object.values(accounts),...state.extraUsers].find(u=>u.account===account);modal('调整终端授权',`<p>账号 ${h(u.name)}（${h(u.account)}），当前角色 ${roleNames[u.role]}。角色与可见设备范围分别管理。</p><div class="target-list">${[...new Set(state.devices.map(d=>d.project))].map(g=>`<label class="target-row"><input type="checkbox" checked><span>${g}</span></label>`).join('')}</div><p class="hint">当前画布仅演示授权编辑，不修改真实本机账号库。</p>`,btn('取消','C.closeModal()')+btn('保存授权',`C.saveUserScope('${h(account)}')`,'primary'));},
  saveUserScope(account){mutate('调整终端授权',{name:account},()=>{closeModal();toast('已模拟保存授权范围','success');});},
  addGroup(){modal('新增项目分组',`${field('分组名称','group-name','')}`,btn('取消','C.closeModal()')+btn('创建分组','C.confirmAddGroup()','primary'));},
  confirmAddGroup(){const name=document.getElementById('group-name').value.trim();if(!name){toast('请填写分组名称','error');return;}if(!/^[\p{L}\p{N} _-]{1,40}$/u.test(name)){toast('分组名称仅支持文字、数字、空格和短横线','error');return;}mutate('新增项目分组',{name},()=>{state.extraGroups.push(name);closeModal();render();toast('项目分组已创建','success');});},
  renameGroup(name){state.renameGroupOld=name;modal('重命名项目分组',field('新名称','rename-group',name),btn('取消','C.closeModal()')+btn('保存名称','C.confirmRenameGroup()','primary'));},
  confirmRenameGroup(){const name=document.getElementById('rename-group').value.trim();if(!name){toast('请填写分组名称','error');return;}if(!/^[\p{L}\p{N} _-]{1,40}$/u.test(name)){toast('分组名称仅支持文字、数字、空格和短横线','error');return;}mutate('重命名分组',{name},()=>{state.devices.forEach(d=>{if(d.project===state.renameGroupOld)d.project=name;});state.extraGroups=state.extraGroups.map(g=>g===state.renameGroupOld?name:g);closeModal();render();toast('分组名称已保存','success');});},
  deleteGroup(name){if(state.devices.some(d=>d.project===name)){toast('分组内仍有终端，请先调整终端归属','error');return;}confirmSimple('删除空分组',`确认删除分组 ${h(name)}？`,()=>mutate('删除项目分组',{name},()=>{state.extraGroups=state.extraGroups.filter(g=>g!==name);render();toast('空分组已删除','success');}));},
  saveConnection(){const address=document.getElementById('platform-address').value.trim();if(!/^https?:\/\//.test(address)){toast('请填写本机数据目录','error');return;}confirmSimple('切换本机数据目录',`将本机数据目录切换为 ${h(address)}。正式应用需要重新验证当前账号和授权范围。`,()=>mutate('切换本机数据目录',{name:'本机'},()=>toast('已模拟保存连接设置','success'),true));},
  restartService(){mutate('重启采集引擎',{name:'本机'},()=>{stopJobs();state.service=true;render();toast('采集引擎已模拟恢复，先读取并核验状态','success');},true);},
  diagnostics(){modal('本机连接诊断',`<div class="settings-row"><label>本机采集引擎</label>${badge(state.service?'online':'offline')}</div><div class="settings-row"><label>本机台账库</label>${badge(state.platform?'online':'offline')}</div><div class="settings-row"><label>当前授权终端</label><span class="small muted">${visibleDevices().length} 台</span></div><div class="settings-row"><label>局域网终端示例</label><span class="mono small">192.168.1.51</span></div><p class="hint" style="margin-top:16px">检查网络连接、目标地址和应用访问权限，不要求关闭系统防火墙或杀毒软件。</p>`);},
};
Object.assign(C,{
 simulateNetworkApply(id){const t=visibleTasks().find(t=>t.id===id);if(!t||t.kind!=='network'||!t.results[0]?.sent)return;applyFirmwareNetwork(t,t.results[0],true);toast('审阅工具已模拟固件切换；设备任务未重发，请随后只读核验');reviewbar();},
 publishModal(materialId=null,ids=null){state.publishFromDraft=null;state.publishUploadOnly=false;publishModal(materialId,ids);},
 flowScenario(value){state.flowScenario=value;reviewbar();toast('场景仅作用于随后创建的任务；已有任务的设备事实不会被改写');},
 mode(mode){if(!flowCanEdit()||!['video','image'].includes(mode))return;mediaDraft(device()).mode=mode;render();},
 moveTrack(i,delta){if(!flowCanEdit())return;const draft=mediaDraft(device()),list=draft[draft.mode],j=i+delta;if(j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];render();},
 removeTrack(i){if(!flowCanEdit())return;const d=mediaDraft(device());d[d.mode].splice(i,1);render();},
 discardMediaDraft(){if(!flowCanEdit())return;delete state.flowDrafts[draftKey(device().id)];render();},
 addTrackModal(){if(!flowCanEdit())return;const d=device(),draft=mediaDraft(d),type=draft.mode,names=[...new Set([...d.storedFiles.filter(name=>type==='video'?/\.(mp4|avi)$/i.test(name):/\.(jpg|jpeg|png)$/i.test(name)&&name!==d.logoFile),...state.materials.filter(m=>m.type===type).map(m=>m.name)])].filter(n=>!draft[type].includes(n));modal('添加到'+(type==='video'?'视频':'图片')+'草稿',`<p>只加入草稿，不立即上传或应用。</p>${names.map(n=>`<div class="settings-row"><span>${h(n)}</span>${btn('加入',`C.addTrack(${jsArg(n)})`,'sm')}</div>`).join('')||'<p class="hint">没有可添加的同类型文件。</p>'}`);},
 addTrack(name){if(!flowCanEdit())return;const draft=mediaDraft(device()),list=draft[draft.mode];if(!list.includes(name))list.push(name);closeModal();render();},
 uploadToDevice(){state.publishFromDraft=null;state.publishUploadOnly=true;publishModal(null,[device().id]);},
 publishCurrentPlaylist(){if(!flowCanEdit())return;const d=device(),draft=mediaDraft(d);if(!draft[draft.mode].length){toast('空播放列表禁止提交','error');return;}if(!flowChanged(draft)){toast('播放草稿没有变化，不创建任务');return;}if(draft.baseline!==d.snapshotVersion){draft.base={mode:d.mode,video:[...d.playlist],image:[...d.imagePlaylist]};draft.baseline=d.snapshotVersion;toast('当前生效配置已变化，草稿已保留，请重新审阅前后值','error');render();return;}state.publishFromDraft=d.id;state.publishUploadOnly=false;publishModal(null,[d.id]);},
 publishType(type){state.publishType=type;state.publishFromDraft=null;publishModal(null,state.publishPlan?.targetIds);},
 acceptOverwrite(){const p=state.publishSubmit;if(!p)return;state.publishSubmit=null;submitPublish(p.plan,p.ids,p.files,p.applyOrder,true);},
 deleteFile(name){if(!flowCanEdit())return;const d=device();if(fileReferenced(d,name)){toast('生效配置正在引用该文件，请先发布新的配置','error');return;}if([d.logoFile,d.textFile].includes(name)){toast('Logo / TXT单例不使用普通删除流程','error');return;}confirmSimple('删除未引用设备素材',`${h(d.name)} / ${h(d.sn)}：${h(name)}。仅删除设备文件，不删除本机素材库。`,()=>{const t=createTask('delete','删除设备素材 · '+d.name,[d.id],['预检引用','del_file','回读'],'',{request:{name}});if(t){state.page='tasks';render();}});},
 paramInput(key,value){if(!flowCanEdit())return;paramDraft(device()).values[key]=key==='subtitle'?value:Number(value);},
 networkInput(key,value){if(!flowCanEdit())return;state.networkDrafts ||= {};const d=device();state.networkDrafts[draftKey(d.id)] ||= cloneFlow(d.networkConfig);state.networkDrafts[draftKey(d.id)][key]=value;},
 verifyTask(){const t=visibleTasks().find(t=>t.id===state.taskSelected)||visibleTasks()[0];if(t)verifyTaskReadOnly(t);},
 refreshTask(){if(!state.user)return;render();toast('已读取本机任务事实；刷新记录不重放设备操作');},
 taskFilter(value){state.taskFilter=value;render();},
 task(id){if(!visibleTasks().some(t=>t.id===id))return;state.taskSelected=id;render();},
 cancelQueued(){const t=visibleTasks().find(t=>t.id===state.taskSelected)||visibleTasks()[0];if(!t)return;const count=t.results.filter(r=>r.state==='queued'||r.state==='prechecking'&&!r.sent).length;confirmSimple('取消未开始项',`可取消 ${count} 个目标。已发送的动作不撤销，仍记录响应与核验。`,()=>{if(!authorizeWrite(t.targets).ok){toast('当前不能修改任务队列','error');return;}for(const r of t.results){if(r.state==='queued'||r.state==='prechecking'&&!r.sent){r.state='cancelled';r.phase='cancelled';r.message='用户取消，未发送设备写请求';if(r.active){r.active=false;state.flowActive=Math.max(0,state.flowActive-1);}}}taskSummary(t);pumpTasks();render();});},
 retryPlatform(id){const t=visibleTasks().find(t=>t.id===id);if(!t)return;if(!authorizeWrite(t.targets).ok){toast('写入本机台账需要有效会话、本机库与采集引擎','error');return;}for(const r of t.results){if(r.deviceResult!=='verified'||r.platformSync==='synced'||r.active)continue;r.active=true;state.flowActive++;t.halted=false;t.epoch=state.sessionEpoch;t.platformRetryScenario=state.flowScenario;r.message='设备结果保持已核验，正在独立重试保存本机记录';syncPlatform(t,r);}render();},
 maintenance(action){if(!flowCanEdit())return;if(!['激活设备','校准时间','重启设备'].includes(action)){toast('未定义的维护动作','error');return;}const d=device();if(action==='激活设备'){const why=activationBlockReason(d);if(why){toast(why,'error');return;}}confirmSimple('确认'+action,`${h(d.name)} / ${h(d.sn)}。${action==='重启设备'?'重启会短时中断网络与显示；受理后只读核验，不自动重启第二次。':'设备受理、实际结果与本机记录分开。'}`,()=>{const t=createTask('maintenance',action+' · '+d.name,[d.id],['身份预检','设备受理','恢复核验','本机登记'],'',{request:{action}});if(t){state.page='tasks';render();}});},
 batchParams(){if(!flowCanEdit())return;if(!state.selected.size){toast('请先选择终端');return;}modal('批量音量草稿',`<p>固定目标快照：${state.selected.size}台，最多2台并发；只提交与当前值不同的目标。</p>${field('音量（1—99整数）','batch-volume',35,'number')}`,btn('取消','C.closeModal()')+btn('审阅并确认批量设置','C.confirmBatchParams()','primary'));},
 confirmBatchParams(){const volume=Number(document.getElementById('batch-volume').value);if(!Number.isInteger(volume)||volume<1||volume>99){toast('音量须为1—99整数','error');return;}const ids=[...state.selected].filter(id=>visibleDevices().some(d=>d.id===id&&d.volume!==volume));if(!ids.length){toast('所有目标音量均无变化，不创建任务');return;}const t=createTask('params','批量音量设置',ids,['逐台预检','setvol','回读','本机登记'],'',{request:{values:{volume}}});if(t){closeModal();state.page='tasks';render();}},
 importPackage(){modal('本地升级包暂不开放',notice('本地包缺少已确认的适配信息与完整性校验时禁止执行，不能只填版本名就加入可升级包。','amber'));},
 confirmImportPackage(){toast('缺少认可的包元数据，禁止导入为可升级包','error');},
});
// Guard every direct public write entry, including console calls, before reading form values.
for(const name of ['confirmPublish','acceptOverwrite','confirmParams','confirmNetwork','confirmUpgrade','confirmBatchParams','confirmAddDevice','confirmImport','confirmImportPackage','maintenance','deleteFile','saveParams','saveNetwork','upgradeModal','publishModal','batchParams','importPackage','capture','archiveLog','addUser','confirmAddUser','saveUserScope','confirmAddGroup','confirmRenameGroup','deleteGroup','saveConnection','restartService']){
 const method=C[name];if(!method)continue;C[name]=function(...args){const result=authorizeWrite([],{local:['confirmImport','importPackage'].includes(name)});if(!result.ok){toast(result.message,'error');return result;}return method.apply(C,args);};
}
const resetFlowPrototype=C.reset;
C.reset=function(){stopJobs('session');for(const id of state.flowTimers)clearTimeout(id);state.flowTimers.clear();state.facts={};state.flowDrafts={};state.paramDrafts={};state.networkDrafts={};state.publishPlan=null;state.publishSubmit=null;state.flowActive=0;state.requestLog=[];state.nextTaskId=1000;state.flowScenario='success';resetFlowPrototype.call(C);state.facts={};};
C.stopJobs=stopJobs;C.createTask=createTask;C.authorizeWrite=authorizeWrite;C.visibleTasks=visibleTasks;C.verifyTaskReadOnly=verifyTaskReadOnly;

window.C=C;
window.demoDispatchMutation=dispatchMutation;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
render();
