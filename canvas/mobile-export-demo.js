'use strict';
// The review version exports fixture data only; Wi-Fi observations are not available.
(() => {
  C.previewMobileList = function () {
    if (!state.user) return;
    const rows = visibleDevices();
    if (!rows.length) return toast('没有可导出的终端', 'error');
    if (rows.length > 1000) return toast('单次最多导出 1000 台终端', 'error');
    modal('导出到手机', `<p>导出当前账号可查看的 ${rows.length} 台终端，供手机导入后选择。</p><p>当前是模拟数据，${rows.length} 台未取得 Wi-Fi 地址或端口，导入后暂不能连接。清单不包含 Wi-Fi 密码。</p>`, btn('取消','C.closeModal()') + btn('导出清单','C.exportMobileList()','primary'));
  };
  C.exportMobileList = function () {
    if (!state.user) return;
    const rows = visibleDevices();
    if (!rows.length || rows.length > 1000) return toast('终端数量已变化，请重新预览', 'error');
    const devices = rows.map(d => ({sn:d.sn, name:d.name, ...(d.project ? {group:d.project}:{}), ...(d.location ? {location:d.location}:{}), wifi:{}}));
    const content = JSON.stringify({format:'hailing-mobile-devices',version:1,exportedAt:new Date().toISOString(),devices}, null, 2);
    if (new TextEncoder().encode(content).length > 1024 * 1024) return toast('清单超过 1 MiB', 'error');
    download('手机维修设备清单.json', content, 'application/json;charset=utf-8');
    C.closeModal();
  };
})();
