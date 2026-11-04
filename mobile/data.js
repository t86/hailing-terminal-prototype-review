(function(root){
  'use strict';
  const fixture={sn:'YS-2026-0018',version:'2.4.1',hardware:'YS-NET · fixture',targetVersion:'2.5.0',ip:'192.168.1.100',port:80,path:'/elevtor/dev.cgi'};
  const initialNetwork={ip:fixture.ip,mask:'255.255.255.0',gateway:'192.168.1.1',dns:'192.168.1.1'};
  const clone=x=>JSON.parse(JSON.stringify(x));
  function ipv4(value){return typeof value==='string' && /^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(value) && value.split('.').every(n=>+n<=255);}
  function normalizeDnsList(dns){
    if(Array.isArray(dns))return dns.map(x=>String(x??'').trim()).filter(Boolean);
    return String(dns??'').split(',').map(x=>x.trim()).filter(Boolean);
  }
  function networkErrors(n){
    const errors=[]; ['ip','mask','gateway'].forEach(k=>{if(!ipv4(n[k]))errors.push(({ip:'IP',mask:'子网掩码',gateway:'网关'})[k]+'格式不正确');});
    const dnsList=normalizeDnsList(n?.dns);
    if(!dnsList.length)errors.push('DNS格式不正确');
    else if(dnsList.length>2)errors.push('DNS最多两个有效IPv4地址，使用英文逗号分隔');
    else if(dnsList.some(v=>!ipv4(v)||Number(v.split('.')[0])===0||Number(v.split('.')[0])===127||Number(v.split('.')[0])>=224))errors.push('DNS格式不正确');
    if(typeof n?.dns==='string'&&n.dns&&n.dns.split(',').some(v=>!v.trim()))errors.push('DNS列表不能含空项');
    if(errors.length)return errors;
    const num=s=>s.split('.').reduce((a,b)=>((a<<8)>>>0)+ +b,0)>>>0, ip=num(n.ip),mask=num(n.mask),host=(~mask)>>>0,gw=num(n.gateway);
    if(!/^1+0+$/.test(mask.toString(2).padStart(32,'0'))||host<3)errors.push('使用连续掩码，首期不支持 /31、/32');
    if((ip&host)===0||(ip&host)===host)errors.push('IP 不能是网络地址或广播地址');
    if((ip&mask)!==(gw&mask)||(gw&host)===0||(gw&host)===host||gw===ip)errors.push('网关须是同子网的有效主机地址');
    return errors;
  }
  const historyKey=e=>e.sn+'|'+e.port+'|'+e.path;
  const historyID=e=>'recent-'+encodeURIComponent(historyKey(e)).replace(/[!'()*~]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  function historyEntry(e){if(!e||typeof e!=='object'||typeof e.sn!=='string'||!e.sn.trim()||e.sn.length>128||/[\u0000-\u001f]/.test(e.sn)||!ipv4(e.ip)||e.ip.startsWith('0.')||e.ip.startsWith('127.')||+e.ip.split('.')[0]>=224||!Number.isInteger(e.port)||e.port<1||e.port>65535||e.path!==fixture.path||typeof e.lastConnectedAt!=='string'||!Number.isFinite(Date.parse(e.lastConnectedAt))||typeof e.historyId!=='string'||!e.historyId.trim()||!/^[A-Za-z0-9_.:%|-]+$/.test(e.historyId)||e.historyId.length>512)return null;return {historyId:e.historyId,sn:e.sn.trim(),ip:e.ip,port:e.port,path:e.path,lastConnectedAt:e.lastConnectedAt};}
  function loadHistory(saved){const entries=(Array.isArray(saved?.history)?saved.history:[]).map(historyEntry).filter(Boolean).sort((a,b)=>Date.parse(b.lastConnectedAt)-Date.parse(a.lastConnectedAt)),seen=new Set(),ids=new Set(),history=[];for(const e of entries){const key=historyKey(e);if(!seen.has(key)&&!ids.has(e.historyId)){history.push(e);seen.add(key);ids.add(e.historyId);}}const last=saved?.last;if(last&&!Object.prototype.hasOwnProperty.call(saved||{},'history')){const e={sn:last.sn,ip:last.ip,port:Number(last.port||80),path:last.path||fixture.path,lastConnectedAt:last.lastConnectedAt||new Date(0).toISOString()};e.historyId=historyID(e);const valid=historyEntry(e);if(valid&&!seen.has(historyKey(valid)))history.push(valid);}return history.sort((a,b)=>Date.parse(b.lastConnectedAt)-Date.parse(a.lastConnectedAt));}
  const fixtureCapabilities={activation:{requireNonEmptySN:true,defaultSerialNumbers:['0','000000','DEFAULT','SN','UNKNOWN']}};
  // Fixture SN selects a demo profile only; production support must come from the model/firmware capability table.
  fixtureCapabilities.screenshot={confirmedFixtureSNs:[fixture.sn]};
  // r6：升级前适配校验所用的本机验收登记（型号 + 目标版本 + sha256，fixture）。r7：发送前按“目标版本 + sha256”在当前登记中查找，登记被删除或 sha256 不一致即拒绝。升级后版本回读只是完成判定，不能替代本校验。
  fixtureCapabilities.upgradePackage={name:'YS-NET_2.5.0_fixture.pkg',targetVersion:'2.5.0',models:['YS-NET · fixture'],minVersion:'2.4.0',sha256:'fixture-sha256（本机验收登记演示值）',metadata:'fixture-confirmed'};
  // r8：发送前读取所选升级包文件的实际字节成一份快照并重算摘要，与登记 sha256 比较；upload 只发送这份快照。
  // 演示：fixturePackageFiles 模拟手机上所选文件，fixtureFileDigest 以查表 + FNV 代替真实 SHA-256，不是真实哈希或文件读写实现。
  const fixturePackageFiles={'YS-NET_2.5.0_fixture.pkg':'YS-NET-PKG-DEMO-BYTES|2.5.0'};
  const KNOWN_PKG_DIGEST=new Map([['YS-NET-PKG-DEMO-BYTES|2.5.0','fixture-sha256（本机验收登记演示值）']]);
  const fixtureFileDigest=b=>{if(KNOWN_PKG_DIGEST.has(b))return KNOWN_PKG_DIGEST.get(b);let x=2166136261;for(const c of String(b)){x^=c.codePointAt(0);x=Math.imul(x,16777619)>>>0;}return 'sha256-fixture:'+x.toString(16);};
  const fixtureReadFault={name:null};
  function readPackageSnapshot(meta){const name=meta?.name;if(!name||fixtureReadFault.name===name)return {ok:false,reason:'升级包文件无法读取，不发送升级请求'};if(!(name in fixturePackageFiles))return {ok:false,reason:'升级包文件已不存在（缺失），不发送升级请求'};const bytes=String(fixturePackageFiles[name]);const digest=fixtureFileDigest(bytes);const reg=fixtureCapabilities.upgradePackage;if(digest!==meta.sha256||!reg||digest!==reg.sha256)return {ok:false,reason:'升级包文件实际内容与登记的 sha256 不符（文件可能损坏或被替换），不发送升级请求'};return {ok:true,snapshot:Object.freeze({name,bytes,size:bytes.length,sha256:digest})};}
  const verParts=v=>/^\d+(\.\d+)*$/.test(String(v||''))?String(v).split('.').map(Number):null;
  const verCmp=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d<0?-1:1;}return 0;};
  function upgradePrecheck(meta,target){if(!meta||meta.metadata!=='fixture-confirmed'||!meta.sha256)return {allowed:false,reason:'软件包缺少已确认的适配登记（型号 + 目标版本 + sha256），升级前适配校验未通过，不发送升级请求'};const reg=fixtureCapabilities.upgradePackage;if(!reg)return {allowed:false,reason:'软件包已不在本机验收登记（已删除），升级前适配校验未通过，不发送升级请求'};if(reg.sha256!==meta.sha256||reg.targetVersion!==meta.targetVersion)return {allowed:false,reason:'软件包身份（目标版本 + sha256）与本机验收登记不一致，升级前适配校验未通过，不发送升级请求'};if(!target?.sn)return {allowed:false,reason:'尚未核对设备身份，不发送升级请求'};if(!target.hardware)return {allowed:false,reason:'设备硬件型号未知，升级前适配校验未通过，不发送升级请求'};if(!(meta.models||[]).includes(target.hardware))return {allowed:false,reason:'设备型号 '+target.hardware+' 不在软件包适配型号内，不发送升级请求'};const cur=verParts(target.version),goal=verParts(meta.targetVersion),min=verParts(meta.minVersion);if(!cur||!goal)return {allowed:false,reason:'当前版本或目标版本无法识别，不发送升级请求'};if(verCmp(cur,goal)>=0)return {allowed:false,reason:'设备已是目标版本或更高版本，跳过（不强制刷写或降级）'};if(min&&verCmp(cur,min)<0)return {allowed:false,reason:'当前版本低于软件包最低起始版本 '+meta.minVersion+'，不发送升级请求'};return {allowed:true,reason:'升级前适配校验通过；升级后仍须同 SN 且版本回读一致才算完成'};}
  function screenshotEligibility(target){return fixtureCapabilities.screenshot.confirmedFixtureSNs.includes(target?.sn)?{allowed:true,reason:'已核定的fixture截图演示配置'}:{allowed:false,reason:'当前型号截图响应能力未定稿，主动截图禁用；已保存图片仍可查看'};}
  function activationEligibility(sn){const rule=fixtureCapabilities.activation;if(rule.requireNonEmptySN&&(typeof sn!=='string'||!sn.trim()))return {allowed:false,reason:'设备 SN 为空，不能激活'};if(rule.defaultSerialNumbers.includes(String(sn).trim().toUpperCase()))return {allowed:false,reason:'设备仍为 fixture 能力表定义的默认 SN，不能激活'};return {allowed:true,reason:'SN 满足当前 fixture 激活能力规则；无需平台台账，不依赖先写 SN'};}
  function toWire(n){return {ip:n?.ip??null,netmask:n?.netmask??n?.mask??null,gateway:n?.gateway??null,dns:Array.isArray(n?.dns)?n.dns.slice():typeof n?.dns==='string'?n.dns.split(',').map(x=>x.trim()).filter(Boolean):[]};}
  function fromWire(n){return {ip:n.ip,mask:n.netmask,gateway:n.gateway,dns:n.dns.join(',')};}
  function equalNetwork(a,b){const x=toWire(a),y=toWire(b);return ['ip','netmask','gateway'].every(k=>x[k]===y[k])&&JSON.stringify(x.dns)===JSON.stringify(y.dns);}
  function validWire(n){return n&&ipv4(n.ip)&&ipv4(n.netmask)&&ipv4(n.gateway)&&Array.isArray(n.dns)&&n.dns.length>0&&n.dns.every(ipv4);}
  function createModel(saved){
    const state={epoch:0,cacheSN:fixture.sn,storageHealthy:true,status:{connection:'unknown',communication:'unknown',sleep:'unknown',time:null,error:null},phase:'idle',target:null,candidate:null,foreground:true,resumeRequired:false,operations:[],pendingNetwork:null,externalNetworkChange:null,networkObservation:null,fixtureNetwork:null,network:clone(initialNetwork),values:{brightness:65,volume:45,imageInterval:5,textRollingSpeed:1,subtitle:''},capture:{time:'2026-10-28 09:41:08',illustration:true,sn:fixture.sn},last:null,...saved};
    // A reload never resumes a sent write. It only restores its local evidence.
    state.history=loadHistory(saved);state.connectingHistoryId=null;state.epoch++;state.target=null;state.candidate=null;state.phase='idle';state.foreground=true;state.resumeRequired=false;
    state.operations.forEach(o=>{if(['queued','sending','accepted','verifying'].includes(o.status))o.status=o.sent?'uncertain':'cancelled';});
    let serial=state.operations.length;
    const active=()=>state.operations.find(o=>['queued','sending','accepted','verifying'].includes(o.status));
    function remember(target){const key=historyKey(target),existing=state.history.find(e=>historyKey(e)===key),entry={historyId:existing?.historyId||historyID(target),sn:target.sn,ip:target.ip,port:target.port,path:target.path,lastConnectedAt:new Date().toISOString()};state.history=[entry,...state.history.filter(e=>historyKey(e)!==key)].sort((a,b)=>Date.parse(b.lastConnectedAt)-Date.parse(a.lastConnectedAt));return entry;}
    function protectedHistory(entry){return [state.target,state.pendingNetwork].some(t=>t&&t.sn===entry.sn&&t.port===entry.port&&t.path===entry.path)||state.connectingHistoryId===entry.historyId;}
    const api={state,active,
      historyProtected(id){const e=state.history.find(e=>e.historyId===id);return !!e&&protectedHistory(e);},
      removeHistory(id){const e=state.history.find(e=>e.historyId===id);if(!e)throw Error('历史记录不存在');if(protectedHistory(e))throw Error('先断开当前连接或解决待确认换址，再删除这条历史');state.history=state.history.filter(e=>e.historyId!==id);if(state.last&&state.last.sn===e.sn&&state.last.port===e.port)state.last=null;},
      clearHistory(){if(state.history.some(protectedHistory))throw Error('先断开当前连接或解决待确认换址，再清空历史');state.history=[];state.last=null;},
      probeHistory(id){if(active()||state.phase==='probing')throw Error('当前连接或操作处理中，请等待结果');const entry=state.history.find(e=>e.historyId===id);if(!entry)throw Error('历史记录不存在');const token=api.probe(entry.ip,entry.port);state.connectingHistoryId=id;return {...token,historyId:id,expectedSN:entry.sn};},
      canWrite(){return state.storageHealthy!==false && !!state.target && state.phase==='bound' && state.foreground && !state.resumeRequired && !state.pendingNetwork && !(state.externalNetworkChange&&state.externalNetworkChange.status!=='verified') && !(state.networkObservation?.trusted&&!equalNetwork(state.networkObservation.config,state.networkObservation.runtime));},
      probe(ip,port){
        if(active()||state.phase==='probing')throw Error('当前连接或操作处理中，请等待结果');
        if(state.pendingNetwork)throw Error('换址结果待确认：请先核验保留的新旧地址，不能覆盖连接目标');
        if(state.target)throw Error('切换目标前必须先断开当前视频机');
        if(!ipv4(ip)||ip.startsWith('0.')||ip.startsWith('127.')||+ip.split('.')[0]>=224)throw Error('请输入有效的局域网 IPv4 地址');
        if(!Number.isInteger(+port)||+port<1||+port>65535)throw Error('端口须为 1–65535');
        state.epoch++;state.connectingHistoryId=null;state.phase='probing';state.candidate=null;
        return {epoch:state.epoch,ip,port:+port,path:fixture.path};
      },
      receiveIdentity(token,info){if(token.epoch!==state.epoch||!state.foreground)return false;if(!info?.sn){state.phase='idle';throw Error('响应缺少 SN，不能确认设备身份');}state.candidate={...token,...info};if(token.expectedSN&&info.sn!==token.expectedSN){state.phase='identityMismatch';state.connectingHistoryId=null;return false;}state.phase='identity';return true;},
      bind(){if(state.phase!=='identity'||!state.candidate)throw Error('先读取并核对设备身份');state.target={...state.candidate};if(state.cacheSN!==state.target.sn){state.values={brightness:null,volume:null,imageInterval:null,textRollingSpeed:null,subtitle:''};state.network={ip:state.target.ip,mask:null,gateway:null,dns:null};state.networkObservation=null;state.fixtureNetwork=null;state.capture=null;}state.cacheSN=state.target.sn;state.status={connection:'unknown',communication:'unknown',sleep:'unknown',time:null,error:'尚未采集当前状态'};if(state.capture&&state.capture.sn!==state.target.sn)state.capture=null;state.network={...state.network,ip:state.target.ip};if((!state.fixtureNetwork||!validWire(state.fixtureNetwork.config)||!validWire(state.fixtureNetwork.runtime))&&state.target.sn===fixture.sn&&!state.pendingNetwork){const baseline=validWire(toWire(state.network))?toWire(state.network):toWire({...initialNetwork,ip:state.target.ip});state.fixtureNetwork={sn:state.target.sn,oldEndpoint:state.target.ip,newEndpoint:null,oldReachable:true,newReachable:false,config:clone(baseline),runtime:clone(baseline)};}state.last={ip:state.target.ip,sn:state.target.sn,port:state.target.port,version:state.target.version};state.phase='bound';state.candidate=null;state.connectingHistoryId=null;remember(state.target);return state.target;},
      disconnect(){if(state.pendingNetwork&&!state.operations.find(o=>o.id===state.pendingNetwork.id)?.sent)state.pendingNetwork=null;state.epoch++;state.operations.forEach(o=>{if(['queued','sending','accepted','verifying'].includes(o.status)){o.status=o.sent?'uncertain':'cancelled';o.note=o.sent?'连接已断开；已发请求结果待确认':'未发送，已取消';}});state.target=null;state.candidate=null;state.connectingHistoryId=null;state.phase='idle';state.resumeRequired=false;},
      background(){if(!state.target){state.phase='idle';state.candidate=null;state.connectingHistoryId=null;}state.status={connection:'unknown',communication:'unknown',sleep:'unknown',time:null,error:'应用后台，当前状态未知'};if(state.pendingNetwork&&!state.operations.find(o=>o.id===state.pendingNetwork.id)?.sent)state.pendingNetwork=null;state.epoch++;state.foreground=false;state.resumeRequired=!!state.target;state.operations.forEach(o=>{if(['queued','sending','accepted','verifying'].includes(o.status)){o.status=o.sent?'uncertain':'cancelled';o.note=o.sent?'应用进入后台；已发请求待确认，不自动重放':'进入后台前尚未发送，已取消';}});},
      foreground(){state.foreground=true;},
      verifyForeground(sn){if(!state.target||sn!==state.target.sn){state.resumeRequired=true;return false;}state.resumeRequired=false;return true;},
      start(action,details){if(['screenshot','捕获截图'].includes(action)&&!screenshotEligibility(state.target).allowed)throw Error(screenshotEligibility(state.target).reason);if(['激活','device_activate'].includes(action)&&!activationEligibility(state.target?.sn).allowed)throw Error(activationEligibility(state.target?.sn).reason);if(['软件升级','upgrade','pkg_upgrade','upload_pkg'].includes(action)){const g=upgradePrecheck(details?.package,state.target);if(!g.allowed)throw Error(g.reason);const s=readPackageSnapshot(details.package);if(!s.ok)throw Error(s.reason);details={...details,packageSnapshot:s.snapshot};}if(!api.canWrite())throw Error('当前连接尚不满足操作条件，请先完成只读核验');if(active())throw Error('当前视频机已有进行中的操作，请等待结果');const op={id:'M-'+String(++serial).padStart(3,'0'),action,details:details||{},target:clone(state.target),epoch:state.epoch,status:'queued',sent:false,time:new Date().toLocaleTimeString('zh-CN',{hour12:false}),note:'已保存本机操作记录，等待发送'};state.operations.unshift(op);return op;},
      markSent(id){const op=state.operations.find(o=>o.id===id);if(!op||op.epoch!==state.epoch||op.status!=='queued'||state.storageHealthy===false||!state.foreground||state.resumeRequired)return false;if(op.details?.packageSnapshot){const s=op.details.packageSnapshot;if(fixtureFileDigest(s.bytes)!==s.sha256)return false;op.sentPackage={name:s.name,size:s.size,sha256:fixtureFileDigest(s.bytes),source:'与校验相同的快照'};}op.sent=true;op.status='sending';op.note='请求已发出；尚未证明生效';return true;},
      finish(id,result){const op=state.operations.find(o=>o.id===id);if(!op||op.epoch!==state.epoch||!state.target||op.target.sn!==state.target.sn||!state.foreground||!['sending','accepted','verifying'].includes(op.status))return false;op.status=result.error?'failed':result.verified?'verified':'uncertain';op.note=result.error||result.note||(result.verified?'设备回读核验通过':'请求已返回，缺少完成证据');return true;},
      startNetwork(next){const errors=networkErrors(next);if(errors.length)throw Error(errors.join('；'));if(networkErrors(state.network).length)throw Error('尚未取得可核对的当前网络配置');if(state.networkObservation&&!equalNetwork(state.networkObservation.config,state.networkObservation.runtime))throw Error('保存配置与运行配置不一致，请先核验已有变化');if(equalNetwork(next,state.network))throw Error('保存配置与运行配置均无变化');const op=api.start('静态 IP 变更',{old:clone(state.network),next:clone(next)});state.pendingNetwork={id:op.id,sn:state.target.sn,port:state.target.port,path:state.target.path,old:clone(state.network),next:clone(next),phase:'prepared',observations:[]};if(!state.fixtureNetwork||state.fixtureNetwork.sn!==state.target.sn)state.fixtureNetwork={sn:state.target.sn,oldEndpoint:state.target.ip,newEndpoint:null,oldReachable:true,newReachable:false,config:toWire(state.network),runtime:toWire(state.network)};else{state.fixtureNetwork.oldEndpoint=state.target.ip;state.fixtureNetwork.newEndpoint=null;state.fixtureNetwork.oldReachable=true;state.fixtureNetwork.newReachable=false;}op.networkStage='prepared';return op;},
      acceptNetwork(id){const p=state.pendingNetwork,op=state.operations.find(o=>o.id===id);if(!p||p.id!==id||!op?.sent)return false;state.fixtureNetwork.config=toWire(p.next);state.fixtureNetwork.newEndpoint=p.next.ip;state.fixtureNetwork.newReachable=false;p.accepted=true;p.phase='applying_or_uncertain';op.status='accepted';op.networkStage=p.phase;op.note='HTTP 200 已受理；尚未取得运行配置生效证据';return true;},
      applyFixtureNetwork(){const p=state.pendingNetwork,f=state.fixtureNetwork,op=state.operations.find(o=>o.id===p?.id);if(!p?.accepted||!op?.sent||!f)return false;f.runtime=clone(f.config);f.newEndpoint=f.runtime.ip;f.newReachable=true;f.oldReachable=false;return true;},
      readFixtureNetwork(endpoint){const f=state.fixtureNetwork;if(!f||!((endpoint===f.oldEndpoint&&f.oldReachable)||(endpoint===f.newEndpoint&&f.newReachable)))return {error:'该地址无响应（fixture）',receivedAt:new Date().toISOString()};return {sn:f.sn,config:clone(f.config),runtime:clone(f.runtime),receivedAt:new Date().toISOString()};},
      captureExternalNetworkChange(){
        if(!state.networkObservation?.trusted)return null;
        if(equalNetwork(state.networkObservation.config,state.networkObservation.runtime))return state.externalNetworkChange||null;
        if(state.externalNetworkChange)return state.externalNetworkChange;
        const o=state.networkObservation;
        state.externalNetworkChange={
          id:'ext-'+Date.now(), sn:o.sn, capturedAt:new Date().toISOString(),
          oldEndpoint:o.runtime.ip, newEndpoint:o.config.ip,
          trustedConfig:clone(o.config), runtimeAtCapture:clone(o.runtime),
          endpoints:{}, status:'pending_external'
        };
        return state.externalNetworkChange;
      },
      clearExternalNetworkChange(){state.externalNetworkChange=null;},
      observeCurrentNetwork(endpoint,result){
        if(!state.foreground||!state.target)return false;
        const ctx=state.externalNetworkChange;
        const stamp=result?.receivedAt||new Date().toISOString();
        if(result?.error){
          if(ctx)ctx.endpoints[endpoint]={endpoint,role:endpoint===ctx.oldEndpoint?'old':'new',observedAt:stamp,reachable:false,observedSN:null,identity:'unchecked',config:null,runtime:null,error:result.error};
          return false;
        }
        if(result?.sn!==state.target.sn||!validWire(result.config)||!validWire(result.runtime)){
          if(ctx)ctx.endpoints[endpoint]={endpoint,role:endpoint===ctx.oldEndpoint?'old':'new',observedAt:stamp,reachable:true,observedSN:result?.sn||null,identity:result?.sn&&result.sn!==state.target.sn?'mismatch':'unchecked',config:null,runtime:null,error:result?.sn&&result.sn!==state.target.sn?'SN不符，本地址配置不采信':'配置不可采信'};
          return false;
        }
        state.networkObservation={endpoint,sn:result.sn,receivedAt:stamp,config:clone(result.config),runtime:clone(result.runtime),trusted:true};
        state.network=fromWire(result.runtime);
        if(!equalNetwork(result.config,result.runtime)){
          // 首次捕获后保留最初可信目标，后续刷新不得抹掉
          if(!state.externalNetworkChange){
            state.externalNetworkChange={
              id:'ext-'+Date.now(), sn:result.sn, capturedAt:stamp,
              oldEndpoint:result.runtime.ip, newEndpoint:result.config.ip,
              trustedConfig:clone(result.config), runtimeAtCapture:clone(result.runtime),
              endpoints:{}, status:'pending_external'
            };
          }
          const c=state.externalNetworkChange;
          c.endpoints[endpoint]={endpoint,role:endpoint===c.oldEndpoint?'old':'new',observedAt:stamp,reachable:true,observedSN:result.sn,identity:'match',config:clone(result.config),runtime:clone(result.runtime),error:null};
        }else if(ctx){
          ctx.endpoints[endpoint]={endpoint,role:endpoint===ctx.oldEndpoint?'old':'new',observedAt:stamp,reachable:true,observedSN:result.sn,identity:'match',config:clone(result.config),runtime:clone(result.runtime),error:null};
        }
        return true;
      },
      observeNetwork(endpoint,result){const p=state.pendingNetwork;if(!p)return false;const op=state.operations.find(o=>o.id===p.id);if(!state.foreground||!op?.sent)return false;const observation={endpoint,sn:result?.sn||null,receivedAt:result?.receivedAt||new Date().toISOString(),config:result?.config?toWire(result.config):null,runtime:result?.runtime?toWire(result.runtime):null,error:result?.error||null,trusted:false};p.observations=p.observations||[];p.observations.push(observation);const valid=!observation.error&&observation.sn===p.sn&&validWire(result?.config)&&validWire(result?.runtime);observation.trusted=valid;if(valid)state.networkObservation=clone(observation);if(valid&&endpoint===p.next.ip&&equalNetwork(observation.config,p.next)&&equalNetwork(observation.runtime,p.next)){state.epoch++;state.target={sn:p.sn,ip:p.next.ip,port:p.port,path:p.path,version:state.last?.version||fixture.version,epoch:state.epoch};state.network=fromWire(observation.runtime);state.last={ip:p.next.ip,sn:p.sn,port:p.port,path:p.path};remember(state.target);state.phase='bound';state.resumeRequired=false;op.status='verified';op.networkStage='verified';op.networkObservations=clone(p.observations);op.networkObservation=clone(observation);op.note='新址同 SN，保存配置 config 与运行配置 runtime 全字段吻合；已更新本机绑定及最近记录';state.pendingNetwork=null;return true;}if(valid&&endpoint===p.old.ip&&equalNetwork(observation.config,p.next)&&equalNetwork(observation.runtime,p.old)){p.phase='accepted_not_applied';op.note='旧址同 SN：config 已保存目标值，runtime 仍为旧配置；已受理未生效';}else if(!valid&&p.phase==='accepted_not_applied'&&observation.error){op.note='旧址已观察到受理未生效；新址尚不可达，继续保留旧新地址';}else{p.phase='applying_or_uncertain';op.note=observation.error?'地址不可达，生效中 / 待确认；不重发设置':observation.sn!==p.sn?'该地址返回另一 SN，观察不可信；未更新绑定':'同 SN，但 config / runtime 尚未全部吻合目标，生效中 / 待确认';}op.status='uncertain';op.networkStage=p.phase;op.networkObservations=clone(p.observations);op.networkObservation=state.networkObservation?clone(state.networkObservation):null;return false;},
      verifyNetwork(sn,config,runtime,endpoint){const p=state.pendingNetwork;if(!p)return false;return api.observeNetwork(endpoint||p.next.ip,{sn,config:toWire(config),runtime:toWire(runtime)});}

    };return api;
  }
  root.MobileData={fixture,fixtureCapabilities,fixturePackageFiles,fixtureReadFault,fixtureFileDigest,readPackageSnapshot,upgradePrecheck,activationEligibility,screenshotEligibility,toWire,fromWire,equalNetwork,initialNetwork,createModel,ipv4,normalizeDnsList,networkErrors};
})(typeof window==='undefined'?globalThis:window);
