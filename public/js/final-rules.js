// Reglas comerciales finales: la Home define qué programas se venden.
(function(){
  const baseLoad=loadAdminTab;
  loadAdminTab=async function(){
    await baseLoad();
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
