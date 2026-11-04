(function(root){
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={home:'⌂',play:'▷',capture:'▣',results:'≡',parameters:'☷',network:'⇄',logs:'▤',maintenance:'⚙',back:'‹',arrow:'›'};
  const button=(label,action,options={})=>`<button class="button ${options.secondary?'secondary':''} ${options.small?'small':''} ${options.danger?'danger':''}" data-action="${action}" ${options.disabled?'disabled':''}>${label}</button>`;
  const note=(text,tone='info')=>`<div class="note ${tone}">${text}</div>`;
  const row=(label,value)=>`<div class="kv"><span>${label}</span><strong>${esc(value??'未取得')}</strong></div>`;
  const field=(label,name,value,type='text',extra='')=>`<label class="field"><span>${label}</span><input name="${name}" value="${esc(value)}" type="${type}" ${extra}></label>`;
  const card=(content,extra='')=>`<section class="card ${extra}">${content}</section>`;
  const pill=(text,tone='blue')=>`<span class="pill ${tone}">${esc(text)}</span>`;
  const heading=(eyebrow,title,desc='')=>`<div class="section-heading"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>`;
  root.MobileUI={esc,icons,button,note,row,field,card,pill,heading};
})(window);
