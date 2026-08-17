document.addEventListener('click',ev=>{
  const card=ev.target.closest('.mc-next-grid article');
  if(!card)return;
  const title=card.querySelector('h3')?.textContent?.trim();
  if(!title)return;
  const course=(state.catalog?.courses||[]).find(c=>c.title===title);
  if(course&&hasAccess(course))location.hash=`#course/${encodeURIComponent(course.slug)}`;
});
