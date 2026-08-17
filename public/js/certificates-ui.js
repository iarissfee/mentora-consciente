// UI de certificados de finalización.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .mc-certificate-panel{margin:28px 0 8px;padding:24px;border:1px solid #d9d2ca;background:#fbf8f4;display:flex;justify-content:space-between;align-items:center;gap:22px}
    .mc-certificate-panel h3{font-family:"Bodoni Moda",Georgia,serif;color:#173a27;font-size:30px;line-height:1.05;margin:3px 0 8px}
    .mc-certificate-panel p{margin:0;color:#6b6965;max-width:620px}
    .mc-certificate-panel .mc-kicker{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8a6b50;margin:0 0 4px}
    .mc-certificate-download{display:inline-flex;align-items:center;justify-content:center;min-width:210px;padding:13px 18px;background:#173a27;color:#fff!important;font-weight:700;text-decoration:none;white-space:nowrap}
    .mc-certificate-wait{margin:24px 0 8px;padding:16px 18px;border:1px solid #e3ddd6;background:#fff;color:#6d6964;font-size:13px}
    @media(max-width:760px){.mc-certificate-panel{align-items:flex-start;flex-direction:column}.mc-certificate-download{width:100%}}
  `;
  document.head.appendChild(style);

  // Aclara desde el alta que este nombre será el del certificado.
  const relabel=()=>{
    const input=document.querySelector('#register-form input[name="name"]');
    if(!input)return;
    const label=input.closest('label');
    if(label&&label.firstChild)label.firstChild.textContent='Nombre y apellido';
    input.setAttribute('placeholder','Ej: María Elena Gómez');
    let note=document.getElementById('certificate-name-note');
    if(!note){
      note=document.createElement('small');
      note.id='certificate-name-note';
      note.textContent='Se usará tal cual en tus certificados de finalización.';
      label?.appendChild(note);
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',relabel);else relabel();

  function certificateBox(d){
    const total=(d.lessons||[]).length;
    const done=(d.lessons||[]).filter(x=>x.completed).length;
    if(!total)return '';
    if(done<total)return `<div class="mc-certificate-wait">Certificado de finalización: ${done}/${total} clases completadas. Se habilita automáticamente al llegar al 100%.</div>`;
    return `<section class="mc-certificate-panel"><div><p class="mc-kicker">PROGRAMA COMPLETADO</p><h3>Tu certificado está listo.</h3><p>Se genera en PDF con tu nombre, este programa, la fecha de finalización y un código QR de verificación.</p></div><a class="mc-certificate-download" href="/api/my/certificate/${Number(d.course.id)}.pdf">Descargar certificado PDF</a></section>`;
  }

  const previousBindCourse=bindCourse;
  bindCourse=async function(slug,previewRank=null){
    await previousBindCourse(slug,previewRank);
    if(previewRank!==null)return;
    try{
      const d=await api(`/api/my/course/${encodeURIComponent(slug)}`);
      const host=document.querySelector('.mc-lesson-content')||document.querySelector('.lesson-main')||document.querySelector('.mc-course-page')||document.querySelector('.course-layout');
      if(!host||host.querySelector('.mc-certificate-panel,.mc-certificate-wait'))return;
      host.insertAdjacentHTML('beforeend',certificateBox(d));
    }catch(err){console.warn('Certificado UI',err)}
  };

  bindProgress=function(){
    $$('[data-progress]').forEach(c=>c.onchange=async()=>{
      try{
        await api(`/api/my/progress/${c.dataset.progress}`,{method:'POST',body:{completed:c.checked}});
        toast(c.checked?'Clase completada':'Marcada como pendiente');
        setTimeout(()=>renderRoute(),180);
      }catch(x){toast(x.message)}
    })
  };
})();
