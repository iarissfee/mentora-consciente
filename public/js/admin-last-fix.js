// Hotfix final: navegación Ebooks, delimitación visual y cambio 5x5 -> Sana tu cuerpo.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .mc-ebook-editor{border:1.5px solid #c9c1b7!important;background:#fff!important;padding:22px!important;margin:20px 0!important;box-shadow:0 8px 24px rgba(25,42,31,.035)}
    .mc-ebook-editor-title{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e0dbd5;padding-bottom:13px;margin-bottom:17px}
    .mc-ebook-editor-title strong{font-family:"Bodoni Moda",Georgia,serif;font-size:25px;line-height:1.05;color:#173a27}.mc-ebook-editor-title span{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#756d65}
    .mc-ebook-card-admin{border:1.5px solid #c9c1b7!important;box-shadow:0 8px 24px rgba(25,42,31,.035)!important}
    .mc-ebooks-preview{border:1.5px solid #c9c1b7!important}
    @media(max-width:640px){.mc-ebook-editor{padding:16px!important;margin:15px 0!important}.mc-ebook-editor-title strong{font-size:22px}}
  `;
  document.head.appendChild(style);

  // Fuerza Ebooks desde cualquier menú o pestaña, aunque otro script viejo intente interceptarlo.
  document.addEventListener('click',ev=>{
    const hit=ev.target.closest('a[href="#admin/ebooks"],button[data-admin-tab="ebooks"]');
    if(!hit)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    state.adminTab='ebooks';
    if(location.hash!=='#admin/ebooks')history.pushState(null,'','#admin/ebooks');
    Promise.resolve(renderRoute()).catch(err=>{console.error(err);toast('No se pudo abrir Ebooks. Volvé a tocar el apartado.')});
  },true);

  let migrationChecked=false;
  async function migrateSanaTuCuerpo(){
    if(migrationChecked||state.me?.user?.role!=='admin')return false;
    migrationChecked=true;
    try{
      const d=await api('/api/admin/ebooks');
      const old=(d.ebooks||[]).find(x=>/^5x5\b/i.test(String(x.title||'')));
      if(!old)return false;
      await api(`/api/admin/ebooks/${old.id}`,{method:'PUT',body:{
        title:'Sana tu cuerpo',
        subtitle:'Una guía para escuchar tu cuerpo, comprender sus señales y acompañar tu bienestar.'
      }});
      toast('Ebook actualizado a “Sana tu cuerpo”');
      return true;
    }catch(err){console.warn('No se pudo migrar Sana tu cuerpo',err);return false}
  }

  function delimitEbookBlocks(){
    document.querySelectorAll('.mc-ebook-editor').forEach((card,i)=>{
      if(card.querySelector('.mc-ebook-editor-title'))return;
      const input=card.querySelector('input[name="title"]');
      const title=(input&&input.value)||`Ebook ${i+1}`;
      const head=document.createElement('div');
      head.className='mc-ebook-editor-title';
      head.innerHTML=`<strong>${e(title)}</strong><span>EDITAR EBOOK</span>`;
      card.prepend(head);
    });
  }

  const previousLoadAdminTab=loadAdminTab;
  loadAdminTab=async function(){
    await previousLoadAdminTab();
    if(!['home','ebooks'].includes(state.adminTab))return;
    const changed=await migrateSanaTuCuerpo();
    if(changed)await previousLoadAdminTab();
    delimitEbookBlocks();
  };
})();
