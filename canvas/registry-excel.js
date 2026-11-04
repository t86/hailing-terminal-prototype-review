'use strict';
// Interactive review data stays in this page; it is not a device or production database.
(() => {
  const headers = ['终端名称', '序列号', 'IP地址', '端口', '项目分组', '安装位置'];
  let pending = null;
  function allowed() { return !!state.user && !readOnly() && state.platform; }
  function saveWorkbook(rows, filename) {
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = [22, 22, 18, 10, 20, 24].map(wch => ({wch}));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, '终端台账');
    XLSX.writeFile(book, filename, {bookType:'xlsx'});
  }
  C.downloadTerminalTemplate = function () {
    if (!allowed()) return toast('当前账号不能下载导入模板', 'error');
    saveWorkbook([], '终端台账导入模板.xlsx');
  };
  C.exportTerminalExcel = function () {
    if (!state.user) return;
    const rows = visibleDevices().map(d => [d.name, d.sn, d.ip, d.port || 80, d.project || '', d.location || '']);
    saveWorkbook(rows, '终端台账.xlsx');
  };
  C.importTerminalExcel = function () {
    if (!allowed()) return toast('当前账号不能导入终端', 'error');
    pending = null;
    modal('导入终端', '<p>选择按模板填写的 Excel 文件。终端名称、序列号、IP 地址和端口为必填。端口可在终端详情查看，常用值为 80；分组需在系统中已存在。安装位置选填，例如“1 栋 2 单元”；如果终端名称已包含具体位置，可以留空。</p><p>导入前可查看校验结果。导入后设备仍需核验。</p><input id="terminal-excel-file" type="file" accept=".xlsx,.xls,.csv" aria-label="选择终端台账文件">', btn('取消','C.closeModal()') + btn('读取并预览','C.previewTerminalExcel()','primary'));
  };
  function classify(rows) {
    const names = new Set(state.devices.map(d => d.project).concat(state.extraGroups || []));
    const sns = new Set(), ips = new Set();
    return rows.map((cells, i) => {
      const [name, sn, ip, portText, group, location] = headers.map((_, j) => String(cells[j] ?? '').trim());
      const port = Number(portText);
      const item = {line:i + 2, name, sn, ip, port, group, location};
      const parts = ip.split('.');
      let reason = '';
      if (!name || !sn || !ip || !portText) reason = '名称、序列号、IP 地址和端口为必填';
      else if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255)) reason = 'IP 地址格式错误';
      else if (!Number.isInteger(port) || port < 1 || port > 65535) reason = '端口应为 1 至 65535';
      else if (group && !names.has(group)) reason = '项目分组不存在，请先创建分组';
      else if (sns.has(sn) || ips.has(ip)) reason = '文件中序列号或 IP 地址重复';
      else if (state.devices.some(d => d.ip === ip && d.sn !== sn)) reason = 'IP 地址已被其他终端使用';
      if (sn) sns.add(sn); if (ip) ips.add(ip);
      if (reason) return {...item, kind:'invalid', reason};
      const existing = state.devices.find(d => d.sn === sn);
      return {...item, id:existing?.id, kind:existing ? 'update' : 'new', reason:existing ? '更新后需重新核验' : '新增后需核验'};
    });
  }
  function preview() {
    const rows = classify(pending.rows), count = kind => rows.filter(r => r.kind === kind).length;
    modal('导入预览', `<p>文件：${h(pending.filename)}</p><p>新增 ${count('new')} 台 · 更新 ${count('update')} 台 · 无效或冲突 ${count('invalid')} 行</p><table class="table"><thead><tr><th>行</th><th>终端名称</th><th>序列号</th><th>IP 地址</th><th>结果</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.line}</td><td>${h(r.name)}</td><td>${h(r.sn)}</td><td>${h(r.ip)}</td><td>${h(r.reason)}</td></tr>`).join('')}</tbody></table><p>无效或冲突的行会跳过，导入后终端状态为待核验。</p>`, btn('取消','C.closeModal()') + (rows.some(r => r.kind !== 'invalid') ? btn('确认导入','C.confirmTerminalExcel()','primary') : ''), true);
  }
  C.previewTerminalExcel = async function () {
    const file = document.getElementById('terminal-excel-file')?.files?.[0];
    if (!file) return toast('请选择文件', 'error');
    if (file.size > 2 * 1024 * 1024) return toast('文件不能超过 2 MB', 'error');
    const account = state.user?.account, epoch = state.sessionEpoch;
    try {
      const buffer = await file.arrayBuffer();
      if (!allowed() || account !== state.user?.account || epoch !== state.sessionEpoch) return toast('会话已变化，请重新选择文件', 'error');
      const book = XLSX.read(buffer, {type:'array', sheetRows:1002});
      const sheet = book.Sheets[book.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, {header:1, raw:false, defval:''});
      if (data.length > 1001) return toast('单次最多导入 1000 行', 'error');
      const first = data.shift() || [];
      if (headers.slice(0,4).some((name,i) => String(first[i] ?? '').trim() !== name)) return toast('表头不匹配，请使用下载的模板', 'error');
      const rows = data.filter(row => row.some(v => String(v).trim()));
      if (!rows.length) return toast('文件没有填写终端数据', 'error');
      pending = {filename:file.name, rows, account, epoch}; preview();
    } catch { toast('文件无法读取，请检查 Excel 格式', 'error'); }
  };
  C.confirmTerminalExcel = function () {
    if (!pending || !allowed() || pending.account !== state.user?.account || pending.epoch !== state.sessionEpoch) return toast('预览已失效，请重新导入', 'error');
    const rows = classify(pending.rows); let added = 0, updated = 0;
    mutate('导入终端', {name:pending.filename}, () => {
      let id = Math.max(0, ...state.devices.map(d => d.id));
      for (const r of rows) {
        if (r.kind === 'invalid') continue;
        if (r.kind === 'new') { state.devices.push({...initialDevices()[0], id:++id, name:r.name, sn:r.sn, ip:r.ip, port:r.port, project:r.group || '未分组', location:r.location, online:'unknown', comm:'unknown', sleep:'unknown', version:'未知', verified:false, sampledAt:null}); added++; }
        else { const d = state.devices.find(x => x.id === r.id); Object.assign(d, {name:r.name, ip:r.ip, port:r.port, project:r.group || '未分组', location:r.location, verified:false, sampledAt:null}); updated++; }
      }
    }, true);
    pending = null; render();
    modal('导入结果', `<p>新增 ${added} 台 · 更新 ${updated} 台 · 跳过 ${rows.length-added-updated} 行。</p><p>导入的终端需要核验后使用。</p>`, btn('完成','C.closeModal()','primary'));
  };
})();
