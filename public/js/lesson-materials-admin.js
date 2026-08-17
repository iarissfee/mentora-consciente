// Administración de materiales PDF por clase.
(function(){
  const previousBind=bindAdminCourses;
  bindAdminCourses=function(d){
    previousBind(d);
    const cards=[...document.querySelectorAll('.mc-manage-course')];
    d.courses.forEach((course,ci)=>{
      const card=cards[ci];if(!card)return;
      const upload=card.querySelector('.upload-pdf-form');
      if(upload&&!upload.querySelector('[name="lesson_id"]')){
        const title=upload.querySelector('h5');if(title)title.textContent='+ Agregar material PDF';
        const options=[`<option value="">Recurso general del curso</option>`,...(course.lessons||[]).map((l,i)=>`<option value="${l.id}">Clase ${i+1} · ${e(l.title)}</option>`)];
        const label=document.createElement('label');label.innerHTML=`Material de qué clase<select name="lesson_id">${options.join('')}</select>`;
        const level=upload.querySelector('label:has(select[name="required_rank"])');
        if(level)upload.insertBefore(label,level);else upload.insertBefore(label,upload.querySelector('button'));
      }

      const lessonRows=[...card.querySelectorAll('.mc-course-block:first-of-type .mc-admin-list-row')];
      (course.lessons||[]).forEach((lesson,li)=>{
        const row=lessonRows[li];if(!row||row.querySelector('[data-add-pdf-lesson]'))return;
        const b=document.createElement('button');b.type='button';b.className='mini-btn';b.dataset.addPdfLesson=String(lesson.id);b.textContent='+ PDF';
        b.onclick=()=>{const select=upload?.querySelector('[name="lesson_id"]');if(select)select.value=String(lesson.id);upload?.scrollIntoView({behavior:'smooth',block:'center'});upload?.querySelector('input[name="title"]')?.focus()};
        const del=row.querySelector('[data-delete-lesson]');if(del)row.insertBefore(b,del);else row.appendChild(b)
      });

      const assetRows=[...card.querySelectorAll('.mc-course-block:nth-of-type(2) .mc-admin-list-row')];
      (course.assets||[]).forEach((asset,ai)=>{
        const row=assetRows[ai];if(!row)return;
        const small=row.querySelector('small');if(!small||small.dataset.lessonLabel)return;
        const lesson=(course.lessons||[]).find(l=>Number(l.id)===Number(asset.lesson_id));
        const prefix=lesson?`Clase: ${lesson.title}`:'Recurso general del curso';
        small.textContent=`${prefix} · ${small.textContent}`;small.dataset.lessonLabel='1'
      });
    })
  };
})();
