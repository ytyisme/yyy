const dog=document.querySelector('#dog'), image=document.querySelector('#dog-image'), bubble=document.querySelector('#bubble');
let timer;
const bark=new Image();bark.src='assets/dog33/bark.png';
dog.addEventListener('click',()=>{
  clearTimeout(timer);image.src='assets/dog33/bark.png';image.alt='张开嘴的狗狗';bubble.hidden=false;
  timer=setTimeout(()=>{image.src='assets/dog33/calm.png';image.alt='可爱的狗狗';bubble.hidden=true},1500);
});
