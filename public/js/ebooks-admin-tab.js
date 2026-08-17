// Sección dedicada de Administración → Ebooks.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .mc-ebooks-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:22px}.mc-ebooks-head h2{font-family:"Bodoni Moda",Georgia,serif;font-size:42px;margin:4px 0 8px;color:#153422}.mc-ebooks-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.mc-ebook-card-admin{background:#fff;border:1px solid #ddd8d2;padding:20px}.mc-ebook-card-top{display:grid;grid-template-columns:110px 1fr;gap:16px;align-items:start}.mc-ebook-card-top img{width:110px;aspect-ratio:3/4;object-fit:cover;background:#eee9e2}.mc-ebook-card-admin h3{font-family:"Bodoni Moda",Georgia,serif;font-size:28px;margin:0 0 4px;color:#173a27}.mc-ebook-status{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:5px 8px;background:#edf4ee;color:#244b32;margin-bottom:8px}.mc-ebook-status.missing{background:#f5ece7;color:#8a4b38}.mc-ebook-admin-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.mc-ebook-admin-form label{display:flex;flex-direction:column;gap:6px;font-size:12px}.mc-ebook-admin-form label.wide{grid-column:1/-1}.mc-ebook-admin-form input,.mc-ebook-admin-form select{width:100%;padding:11px;border:1px solid #d7d2cc;background:#fff}.mc-ebook-pdf-box{margin-top:16px;padding:15px;background:#f5f1ec;border:1px solid #e2ddd7}.mc-ebook-pdf-box strong{display:block;margin-bottom:5px}.mc-ebook-pdf-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mc-ebook-pdf-actions button{padding:10px 13px;border:1px solid #173a27;background:#173a27;color:#fff;cursor:pointer}.mc-ebook-pdf-actions .danger{background:#fff;color:#8b3d35;border-color:#b58c86}.mc-ebook-save{grid-column:1/-1;background:#173a27;color:#fff;border:0;padding:12px;font-weight:700;cursor:pointer}.mc-ebook-file{margin-top:10px;width:100%}
    @media(max-width:820px){.mc-ebooks-grid{grid-template-columns:1fr}.mc-ebook-admin-form{grid-template-columns:1fr}.mc-ebook-admin-form label.wide,.mc-ebook-save{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const baseAdminHtml=adminHtml;
  adminHtml=async function(){
    let html=await baseAdminHtml();
    if(state.me?.user?.role!=='admin')return html;
    const active=state.adminTab==='ebooks'?'active':'';
    if(!html.includes('href="#admin/ebooks"')){
      html=html.replace(/(<a class="[^"]*" href="#admin\/community"[^>]*>)/,`<a class="${active}" href="#admin/ebooks"><span>▤</span> Ebooks</a>$1`);
    }
    if(!html.includes('data-admin-tab="ebooks"')){
      html=html.replace(/(<button data-admin-tab="community"[^>]*>Comunidad<\/button>)/,`<button data-admin-tab="ebooks" class="${active}">Ebooks</button>$1`);
    }
    if(state.adminTab==='ebooks'){
      html=html.replace('Resumen y ventas','Ebooks');
      html=html.replace('Mirá cómo viene funcionando tu campus.','Gestioná los ebooks que aparecen en la Home y cargá el PDF real de cada uno.');
    }
    return html;
  };

  const baseLoad=loadAdminTab;
  loadAdminTab=async function(){
    if(state.adminTab!=='ebooks')return baseLoad();
    const box=document.getElementById('admin-content');
    if(!box)return;
    box.innerHTML='<section class="panel"><p>Cargando ebooks…</p></section>';
    try{
      const d=await api('/api/admin/ebooks');
      box.innerHTML=ebooksHtml(d.ebooks||[]);
      bindEbooks(box);
    }catch(x){box.innerHTML=`<section class="panel"><p>${e(x.message)}</p></section>`}
  };

  function ebooksHtml(rows){
    return `<section class="panel"><div class="mc-ebooks-head"><div><p class="mc-kicker">LIBRERÍA DE LA HOME</p><h2>Gestioná tus ebooks</h2><p>Acá cargás el PDF verdadero de cada ebook que ya aparece en la página pública. Cuando tenga PDF y PayPal esté conectado, el botón Comprar queda listo para vender.</p></div><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home</a></div><div class="mc-ebooks-grid">${rows.map(ebookCard).join('')}</div></section>`;
  }

  function ebookCard(x){
    const hasPdf=!!x.pdf_stored_name;
    return `<article class="mc-ebook-card-admin" data-ebook-id="${x.id}"><div class="mc-ebook-card-top">${x.cover_url?`<img src="${e(x.cover_url)}" alt="${e(x.title)}">`:'<div></div>'}<div><span class="mc-ebook-status ${hasPdf?'':'missing'}">${hasPdf?'PDF cargado':'Falta PDF'}</span><h3>${e(x.title)}</h3><p>${e(x.subtitle||'Ebook Digital')}</p><small>${x.currency||'USD'} ${Number(x.price||0)}</small></div></div><form class="mc-ebook-admin-form"><label>Título<input name="title" value="${e(x.title)}" required></label><label>Precio<input name="price" type="number" min="0" step="1" value="${Number(x.price||0)}"></label><label>Moneda<select name="currency"><option ${x.currency==='USD'?'selected':''}>USD</option><option ${x.currency==='EUR'?'selected':''}>EUR</option></select></label><label>Orden<input name="sort_order" type="number" value="${Number(x.sort_order||0)}"></label><label class="wide">Subtítulo<input name="subtitle" value="${e(x.subtitle||'')}"></label><label class="wide">Portada (URL)<input name="cover_url" value="${e(x.cover_url||'')}"></label><label class="wide"><span><input name="active" type="checkbox" ${x.active?'checked':''}> Mostrar este ebook en la Home</span></label><button class="mc-ebook-save" type="submit">Guardar cambios</button></form><div class="mc-ebook-pdf-box"><strong>${hasPdf?`PDF actual: ${e(x.pdf_original_name||'ebook.pdf')}`:'Todavía no cargaste el PDF de este ebook.'}</strong>${hasPdf?`<small>${(Number(x.pdf_bytes||0)/1024/1024).toFixed(2)} MB</small>`:'<small>Elegí el archivo PDF que va a recibir la clienta después de comprar.</small>'}<input class="mc-ebook-file" type="file" accept="application/pdf,.pdf"><div class="mc-ebook-pdf-actions"><button type="button" data-upload>${hasPdf?'Reemplazar PDF':'Subir PDF'}</button>${hasPdf?'<button type="button" class="danger" data-delete-pdf>Eliminar PDF</button>':''}</div></div></article>`;
  }

  function bindEbooks(root){
    root.querySelectorAll('[data-ebook-id]').forEach(card=>{
      const id=Number(card.dataset.ebookId),form=card.querySelector('form'),file=card.querySelector('input[type="file"]');
      form.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(form);try{await api(`/api/admin/ebooks/${id}`,{method:'PUT',body:{title:f.get('title'),price:Number(f.get('price')),currency:f.get('currency'),sort_order:Number(f.get('sort_order')),subtitle:f.get('subtitle'),cover_url:f.get('cover_url'),active:!!f.get('active')}});toast('Ebook actualizado');await loadAdminTab()}catch(x){toast(x.message)}};
      card.querySelector('[data-upload]').onclick=async()=>{if(!file.files?.[0])return toast('Elegí primero el PDF.');const fd=new FormData();fd.append('pdf',file.files[0]);try{await api(`/api/admin/ebooks/${id}/pdf`,{method:'POST',body:fd});toast('PDF guardado');await loadAdminTab()}catch(x){toast(x.message)}};
      const del=card.querySelector('[data-delete-pdf]');if(del)del.onclick=async()=>{if(!confirm('¿Eliminar el PDF de este ebook? El botón Comprar quedará inactivo hasta que cargues otro.'))return;try{await api(`/api/admin/ebooks/${id}/pdf`,{method:'DELETE'});toast('PDF eliminado');await loadAdminTab()}catch(x){toast(x.message)}};
    });
  }
})();
