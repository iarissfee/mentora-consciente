// Reglas comerciales finales: la Home define qué programas se venden.
(function(){
  const baseCommunity=communityHtml;
  communityHtml=async function(){
    if(state.me?.user?.role!=='admin'&&!(state.me?.directCourseIds||[]).length&&!state.me?.membership){
      return `<section class="auth-gate"><p class="eyebrow">COMUNIDAD PRIVADA</p><h2>Este espacio se habilita después de tu compra.</h2><p>Cuando un pago quede confirmado, vas a poder entrar a Comunidad desde tu campus.</p><a class="btn btn-primary" href="/">Ver programas</a></section>`
    }
    try{return await baseCommunity()}catch(x){return `<section class="auth-gate"><h2>Comunidad privada</h2><p>${e(x.message||'Este espacio todavía no está habilitado.')}</p><a class="btn btn-primary" href="#campus">Volver a mi campus</a></section>`}
  };

  const baseLoad=loadAdminTab;
  loadAdminTab=async function(){
    await baseLoad();
    if(state.adminTab==='dashboard'){
      try{
        const d=await api('/api/admin/dashboard'),cards=[...document.querySelectorAll('#admin-content .stat-card')],income=cards.find(c=>(c.querySelector('small')?.textContent||'').trim().toUpperCase()==='INGRESOS');
        if(income){const strong=income.querySelector('strong'),entries=Object.entries(d.stats.revenueByCurrency||{});strong.innerHTML=entries.length?entries.map(([cur,val])=>`<span style="display:block">${e(fmtMoney(val,cur))}</span>`).join(''):'US$ 0'}
      }catch{}
      return
    }
    if(state.adminTab!=='courses')return;
    const box=document.getElementById('admin-content');if(!box)return;
    box.querySelectorAll('label').forEach(label=>{
      const hasLegacy=label.querySelector('select[name="required_rank"],input[name="allow_direct_purchase"],input[name="published"]');
      if(hasLegacy)label.remove();
    });
    box.querySelectorAll('.edit-course-form').forEach(form=>{
      form.onsubmit=async ev=>{
        ev.preventDefault();const f=new FormData(form);
        try{
          await api(`/api/admin/courses/${form.dataset.courseId}`,{method:'PUT',body:{title:f.get('title'),slug:f.get('slug'),price:Number(f.get('price')),currency:f.get('currency'),required_rank:0,allow_direct_purchase:true,published:true,sort_order:Number(f.get('sort_order')),subtitle:f.get('subtitle'),description:f.get('description'),cover_url:f.get('cover_url')}});
          await reloadCatalog();toast('Programa actualizado');loadAdminTab()
        }catch(x){toast(x.message)}
      }
    });
    box.querySelectorAll('.mc-customer-preview-label').forEach(x=>x.innerHTML='<strong>👁 Vista como alumna</strong><span>Así se verá el programa después de una compra confirmada.</span>');
    box.querySelectorAll('.mc-course-footer-actions a[href^="#preview/"]').forEach((a,i)=>{if(i===0)a.textContent='Abrir vista como alumna';else a.remove()});
  };
})();
