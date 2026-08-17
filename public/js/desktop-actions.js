document.addEventListener('click',ev=>{
  const logout=ev.target.closest('.mc-side-bottom button');
  if(logout){ev.preventDefault();document.getElementById('auth-button')?.click();return}
  const share=ev.target.closest('[data-mc-share]');
  if(share){ev.preventDefault();const payload={title:document.title,url:location.href};if(navigator.share)navigator.share(payload).catch(()=>{});else navigator.clipboard?.writeText(location.href).then(()=>toast('Link copiado'));}
});
