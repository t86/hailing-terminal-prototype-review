/* 本地评审原型：文件仅在当前浏览器会话可预览，不将二进制写入演示台账。 */
(() => {
  const selectedFiles = { value: [] };
  const previews = new Map();
  const seeded = new Map([
    [1, 'media-preview-demo.mp4?v=2'], [2, 'media-preview-demo.mp4?v=2'],
    [3, 'media-preview-image.svg'], [4, 'media-preview-logo.svg'],
  ]);
  const srcFor = (item) => previews.get(item.id) || seeded.get(item.id) || '';
  const revoke = () => { for (const url of previews.values()) URL.revokeObjectURL(url); previews.clear(); selectedFiles.value = []; };
  const originalSelected = C.filesSelected;
  C.filesSelected = function(files) { selectedFiles.value = Array.from(files || []); return originalSelected.apply(this, arguments); };
  const originalConfirm = C.confirmImport;
  C.confirmImport = function() {
    const before = new Set(state.materials.map(item => item.id));
    const files = selectedFiles.value;
    const result = originalConfirm.apply(this, arguments);
    for (const item of state.materials) {
      if (before.has(item.id) || !['image', 'logo', 'video'].includes(item.type)) continue;
      const file = files.find(f => f.name === item.name && f instanceof Blob);
      if (file) previews.set(item.id, URL.createObjectURL(file));
    }
    if (!state.imported.length) selectedFiles.value = [];
    render();
    return result;
  };
  for (const name of ['logout', 'reset']) {
    const original = C[name];
    if (typeof original === 'function') C[name] = function() { revoke(); return original.apply(this, arguments); };
  }
  addEventListener('beforeunload', revoke);
  C.previewMaterial = function(id) {
    const item = state.materials.find(m => String(m.id) === String(id));
    if (!item || !['image', 'logo', 'video'].includes(item.type)) return;
    const src = srcFor(item);
    if (!src) { modal('素材预览', '<p>本次会话没有该文件，请重新选择文件后预览。</p>'); return; }
    const content = item.type === 'video'
      ? `<video class="media-preview-full" controls autoplay playsinline preload="metadata" src="${h(src)}"></video>`
      : `<img class="media-preview-full" src="${h(src)}" alt="${h(item.name)}">`;
    modal(item.type === 'video' ? '播放视频' : '查看原图', `<p class="media-preview-name">${h(item.name)}</p><div class="media-preview-stage">${content}</div>`, '', true);
  };
  function decorate() {
    if (state.page !== 'media') return;
    const items = state.materials.filter(m => state.mediaType === 'all' || m.type === state.mediaType);
    document.querySelectorAll('.media-grid .media-card').forEach((card, index) => {
      const item = items[index], cover = card.querySelector('.media-cover');
      if (!item || !cover || !['image','logo','video'].includes(item.type)) return;
      const src = srcFor(item);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'media-preview-trigger';
      button.setAttribute('aria-label', (item.type === 'video' ? '播放视频 ' : '查看原图 ') + item.name);
      button.addEventListener('click', () => C.previewMaterial(item.id));
      if (src) {
        const element = document.createElement(item.type === 'video' ? 'video' : 'img');
        element.src = src; element.className = 'media-preview-thumb';
        if (item.type === 'video') { element.muted = true; element.playsInline = true; element.preload = 'metadata'; }
        else element.alt = '';
        button.append(element);
      } else {
        const unavailable = document.createElement('span'); unavailable.textContent = '暂无缩略图'; button.append(unavailable);
      }
      if (item.type === 'video') { const play = document.createElement('span'); play.className = 'media-preview-play'; play.textContent = '▶'; play.setAttribute('aria-hidden','true'); button.append(play); }
      cover.replaceChildren(button);
    });
  }
  const originalRender = render;
  render = function() { const result = originalRender.apply(this, arguments); decorate(); return result; };
  decorate();
})();
