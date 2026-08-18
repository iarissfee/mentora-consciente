// Accesos manuales desde Alumnas: programas y ebooks en un mismo diálogo.
(function(){
  window.openProgramGrantDialog=async function(userId,studentName='la alumna'){
    const old=document.getElementById('grant-program-dialog');if(old)old.remove();
    const courses=(state.catalog?.courses||[]).filter(c=>c.published!==false);
    let ebooks=[];
    try{const d=await api('/api/admin/ebooks');ebooks=(d.ebooks||[]).filter(x=>x.active!==0)}catch{}
    if(!courses.length&&!ebooks.length){toast('No hay programas ni ebooks disponibles para asignar.');return}

    if(!document.getElementById('grant-program-dialog-style')){
      const st=document.createElement('style');st.id='grant-program-dialog-style';st.textContent=`
      #grant-program-dialog::backdrop{background:rgba(16,25,20,.58)}
      #grant-program-dialog{border:0;padding:0;background:transparent;width:min(92vw,520px);max-width:520px}
      #grant-program-dialog .mc-grant-box{background:#fffaf6;border:1px solid #d9d2ca;padding:26px;box-shadow:0 18px 60px rgba(0,0,0,.2)}
      #grant-program-dialog h3{font-family:"Bodoni Moda",Georgia,serif;color:#173a27;font-size:30px;margin:0 0 6px}
      #grant-program-dialog p{margin:0 0 18px;color:#6b6965}
      #grant-program-dialog label{display:block;font-weight:700;margin-bottom:18px}
      #grant-program-dialog select{width:100%;margin-top:8px;padding:13px;border:1px solid #cfc8c0;background:#fff;font:inherit}
      #grant-program-dialog .mc-access-kind{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 20px}
      #grant-program-dialog .mc-access-kind button{padding:12px;border:1px solid #173a27;background:#fff;color:#173a27;font-weight:700}
      #grant-program-dialog .mc-access-kind button.active{background:#173a27;color:#fff}
      #grant-program-dialog .mc-grant-actions{display:flex;gap:10px;justify-content:flex-end}
      #grant-program-dialog .mc-grant-actions button{padding:12px 18px;border:1px solid #173a27;background:#fff;color:#173a27;font-weight:700}
      #grant-program-dialog .mc-grant-actions button[type="submit"]{background:#173a27;color:#fff}`;document.head.appendChild(st)
    }

    const courseOptions=courses.map(c=>`<option value="${Number(c.id)}">${e(c.title)}</option>`).join('');
    const ebookOptions=ebooks.map(x=>`<option value="${Number(x.id)}">${e(x.title)}${x.pdf_stored_name?'':' · sin PDF cargado'}</option>`).join('');
    const initial=courses.length?'course':'ebook';
    const dialog=document.createElement('dialog');dialog.id='grant-program-dialog';dialog.innerHTML=`
      <form method="dialog" class="mc-grant-box" id="grant-program-form">
        <p style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8a6b50">DAR ACCESO MANUAL</p>
        <h3>Elegí qué darle</h3>
        <p>Se lo vamos a habilitar a <strong>${e(studentName)}</strong> para que pueda entrar con su cuenta y probarlo.</p>
        <div class="mc-access-kind">
          <button type="button" data-grant-kind="course" class="${initial==='course'?'active':''}" ${courses.length?'':'disabled'}>Programa</button>
          <button type="button" data-grant-kind="ebook" class="${initial==='ebook'?'active':''}" ${ebooks.length?'':'disabled'}>Ebook</button>
        </div>
        <input type="hidden" name="grantType" value="${initial}">
        <label data-grant-course-label style="${initial==='course'?'':'display:none'}">Programa<select name="courseId">${courseOptions}</select></label>
        <label data-grant-ebook-label style="${initial==='ebook'?'':'display:none'}">Ebook<select name="ebookId">${ebookOptions}</select></label>
        <div class="mc-grant-actions"><button type="button" data-close-grant>Cancelar</button><button type="submit">Dar acceso</button></div>
        <p id="grant-program-message" style="margin:14px 0 0;color:#a34235"></p>
      </form>`;
    document.body.appendChild(dialog);
    const form=dialog.querySelector('#grant-program-form');
    const typeInput=form.querySelector('[name="grantType"]');
    const courseLabel=form.querySelector('[data-grant-course-label]');
    const ebookLabel=form.querySelector('[data-grant-ebook-label]');
    form.querySelectorAll('[data-grant-kind]').forEach(btn=>btn.onclick=()=>{
      const type=btn.dataset.grantKind;typeInput.value=type;
      form.querySelectorAll('[data-grant-kind]').forEach(x=>x.classList.toggle('active',x===btn));
      courseLabel.style.display=type==='course'?'':'none';ebookLabel.style.display=type==='ebook'?'':'none';
    });
    dialog.querySelector('[data-close-grant]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    form.onsubmit=async ev=>{
      ev.preventDefault();
      const fd=new FormData(form),type=String(fd.get('grantType')||'course'),itemId=Number(type==='ebook'?fd.get('ebookId'):fd.get('courseId'));
      const msg=dialog.querySelector('#grant-program-message'),submit=form.querySelector('button[type="submit"]');
      if(!itemId){msg.textContent=type==='ebook'?'Elegí un ebook.':'Elegí un programa.';return}
      submit.disabled=true;msg.textContent='';
      try{
        await api('/api/admin/grant',{method:'POST',body:{userId:Number(userId),type,itemId}});
        dialog.close();toast(type==='ebook'?'Ebook habilitado correctamente':'Programa habilitado correctamente');await loadAdminTab()
      }catch(x){msg.textContent=x.message||'No se pudo dar acceso.';submit.disabled=false}
    };
    dialog.showModal()
  };

  window.bindStudentActions=function(){
    $$('[data-grant-plan]').forEach(b=>b.onclick=async()=>{const id=Number(b.dataset.grantPlan),options=state.catalog.plans.map(p=>`${p.id}: ${p.name}`).join('\n'),choice=prompt(`ID de membresía para asignar:\n${options}`);if(!choice)return;try{await api('/api/admin/grant',{method:'POST',body:{userId:id,type:'plan',itemId:Number(choice)}});toast('Membresía asignada');loadAdminTab()}catch(x){toast(x.message)}});
    $$('[data-grant-course]').forEach(b=>{
      b.textContent='Dar programa / ebook';
      b.onclick=()=>{const id=Number(b.dataset.grantCourse),name=(b.closest('tr')?.querySelector('td')?.childNodes?.[0]?.textContent||b.closest('tr')?.querySelector('td')?.textContent||'la alumna').trim();openProgramGrantDialog(id,name)}
    })
  };
})();
