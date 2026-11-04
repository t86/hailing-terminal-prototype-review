(function(root){'use strict';
  if(root.AppUpdateHost||!root.AppUpdate)return;
  const mobile=!!root.MobileApp,app=root.MobileApp,desktopState=root.C?.state;
  let platform=mobile?'android':'windows',scenario='normal',epoch=0,reviewExpanded=false;
  function load(){let prefs={};try{prefs=JSON.parse(localStorage.getItem('ys-app-update-demo-'+platform)||'{}');}catch{}return root.AppUpdate.create({platform,...Object.fromEntries(['currentVersion','autoCheck','policy','source','windowStart','windowEnd'].filter(k=>prefs[k]!==undefined).map(k=>[k,prefs[k]]))});}
  let model=load();
  function save(){try{localStorage.setItem('ys-app-update-demo-'+platform,JSON.stringify(Object.fromEntries(['currentVersion','autoCheck','policy','source','windowStart','windowEnd'].map(k=>[k,model.state[k]]))));}catch{model.state.message='应用更新偏好未保存；生产安装前仍需可靠检查点。';}}
  function realBusy(){if(mobile)return !!app.model.active()||!!app.model.state.pendingNetwork||app.model.state.operations.some(o=>o.sent&&o.status==='uncertain'&&['软件升级','静态 IP 变更'].includes(o.action));return (desktopState?.tasks||[]).some(t=>(t.results||[]).some(r=>r.active||r.state==='queued'||r.sent&&r.state==='uncertain'&&['network','upgrade'].includes(t.kind)));}
  function environment(){return {internetReachable:!['internet_offline','all_offline'].includes(scenario),lanReachable:scenario!=='all_offline',hasUpdate:scenario!=='up_to_date',signatureValid:scenario!=='signature_failed',downloadFails:scenario==='download_failed',sourceConfigured:scenario!=='unconfigured',busy:scenario==='device_busy'||realBusy(),checkpointHealthy:scenario!=='checkpoint_failed'&&!(mobile&&app.storageError),inMaintenanceWindow:scenario==='maintenance_window',foreground:!mobile||app.model.state.foreground};}
  function redraw(){save();if(mobile)app.render();else root.render();}
  function cancelPending(){epoch++;if(['checking','downloading'].includes(model.state.phase)){model.state.phase=model.state.availableVersion?'available':'idle';model.state.message='上下文已变化，请重新检查应用更新。';}}
  function controls(){return `<details class="au-review" data-au-review ${reviewExpanded?'open':''}><summary>应用自身更新演示工具</summary><div class="au-review-controls"><label>网络 / 异常 <select data-au-scenario>${Object.entries({normal:'更新源正常',internet_offline:'无公网，局域网源可达',all_offline:'所有更新源不可达',signature_failed:'更新包签名失败',download_failed:'下载中断',device_busy:'设备任务进行中',checkpoint_failed:'恢复记录保存失败',up_to_date:'已是最新版本',unconfigured:'未配置发布更新源',maintenance_window:'进入空闲维护窗口'}).map(([k,v])=>`<option value="${k}" ${scenario===k?'selected':''}>${v}</option>`).join('')}</select></label>${mobile?`<label>手机平台 <select data-au-platform><option value="android" ${platform==='android'?'selected':''}>Android</option><option value="ios" ${platform==='ios'?'selected':''}>iOS</option></select></label>`:''}<button type="button" class="au-button" data-au-action="auto">运行一次自动策略（演示）</button><button type="button" class="au-button" data-au-action="reset">重置更新演示</button></div></details>`;}
  function panel(){return root.AppUpdate.render(model);}
  if(mobile){
    const screens=root.MobileScreens;
    screens.titles['app-updates']='关于与应用更新';screens['app-updates']=()=>panel();
    for(const key of ['home','connect']){const original=screens[key];screens[key]=function(a){return original(a)+'<button type="button" class="button secondary" data-au-open>关于与应用更新</button>';};}
    document.querySelector('.review-controls')?.insertAdjacentHTML('afterend',controls());
  }else{
    const originalSettings=root.settings;root.settings=function(){return originalSettings()+panel();};
    const originalReview=root.reviewbar;root.reviewbar=function(){originalReview();document.getElementById('reviewbar').insertAdjacentHTML('beforeend',controls());};
  }
  function open(){if(mobile){if(!app.model.state.foreground)return;app.page='app-updates';app.modal=null;app.render();document.querySelector('.screen-content')?.scrollTo(0,0);}else root.C.nav('settings');}
  async function run(action){
    if(action==='reset'){epoch++;try{localStorage.removeItem('ys-app-update-demo-'+platform);}catch{}model=root.AppUpdate.create({platform});scenario='normal';if(mobile){document.querySelector('[data-au-scenario]').value=scenario;}redraw();return;}
    if(mobile&&!app.model.state.foreground){model.state.phase='deferred';model.state.message='回到前台后再检查或转交系统分发，后台不运行原型更新任务。';redraw();return;}
    try{const env=environment();
      if(action==='check'||action==='download'){const token=++epoch;model.state.phase=action==='check'?'checking':'downloading';redraw();await new Promise(resolve=>setTimeout(resolve,450));if(token!==epoch)return;if(action==='check')model.check(environment());else model.download(environment());}
      else if(action==='install')model.install(env);
      else if(action==='distribution')model.openDistribution(env);
      else if(action==='auto')model.runAutomatic(env);
      else if(action==='complete'){if(realBusy()||scenario==='device_busy'){model.state.phase='deferred';model.state.message='设备任务尚未结束，停止此次模拟安装。';}else if(environment().checkpointHealthy===false){model.state.phase='checkpoint_failed';model.state.message='检查点未可靠保存，未进入模拟安装。';}else{model.completeInstall();if(!mobile){root.C.logout();desktopState.service=true;}}}
      redraw();
    }catch(e){model.state.message=e.message;redraw();}
  }
  document.addEventListener('toggle',event=>{if(event.target.hasAttribute?.('data-au-review'))reviewExpanded=event.target.open;},true);
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-au-open')){event.preventDefault();event.stopImmediatePropagation();open();return;}
    if(mobile&&app.page==='app-updates'&&!app.model.state.target&&button.classList.contains('back-button')){event.preventDefault();event.stopImmediatePropagation();app.page='connect';app.render();return;}
    if(button.dataset.auAction){event.preventDefault();event.stopImmediatePropagation();run(button.dataset.auAction);}
  },true);
  document.addEventListener('change',event=>{const el=event.target;
    if(el.hasAttribute('data-au-scenario')){cancelPending();scenario=el.value;redraw();return;}
    if(el.hasAttribute('data-au-platform')){epoch++;platform=el.value;model=load();redraw();return;}
    if(el.dataset.auSetting){cancelPending();const key=el.dataset.auSetting;if(key==='source')model.setSource(el.value);else if(key==='autoCheck')model.state.autoCheck=el.checked;else if(key==='policy'&&['notify','download','maintenance'].includes(el.value))model.state.policy=el.value;else if(['windowStart','windowEnd'].includes(key)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(el.value))model.state[key]=el.value;redraw();}
  },true);
  root.AppUpdateHost={get model(){return model;},run,open,environment};
  redraw();
})(window);
