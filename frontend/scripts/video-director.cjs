// Recording-only presentation helpers. No product code, saved state, or API changes.
const important = /Guardar reflexión|Solicitar ayuda con este tema|Enviar solicitud|Guardar decisión del profesorado|Publicar|Reservar una plaza gratuita|Proponer asistencia sintética|Confirmar mi asistencia sintética|Enviar comentarios constructivos|Mi impacto|Guardar medida confirmada|Save check-in|Request help with this topic|Submit application|Save professor decision|^Publish$|Book a free seat|Propose synthetic attendance|Confirm my synthetic attendance|Send constructive feedback|My impact|Save confirmed action/;
async function installCursor(context, onEvent) {
  await context.exposeBinding('__classallPointerEvent', (_, event) => onEvent(event));
  await context.addInitScript(() => {
    const mount = () => {
      if (document.getElementById('__classall-cursor')) return;
      const host = document.createElement('div');
      host.id = '__classall-cursor';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden';
      const shadow = host.attachShadow({mode:'closed'});
      shadow.innerHTML = `<style>
        *{pointer-events:none!important} .pointer{position:absolute;left:0;top:0;width:32px;height:40px;filter:drop-shadow(0 2px 3px #30322f88)}
        .ring{position:absolute;width:18px;height:18px;margin:-9px;border:3px solid #7460c7;border-radius:50%;box-shadow:0 0 0 2px #fff;background:#c7baf333;animation:pulse .75s ease-out forwards}
        @keyframes pulse{to{transform:scale(3);opacity:0}}
      </style><svg class="pointer" viewBox="0 0 32 40"><path d="M3 2L3 31L11 24L18 37L24 34L17 21L29 20Z" fill="white" stroke="#514090" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
      document.documentElement.append(host);
      const pointer = shadow.querySelector('.pointer');
      let position;
      try { position=JSON.parse(sessionStorage.getItem('__classall-pointer')); } catch {}
      const move = (x,y) => {
        pointer.style.transform=`translate(${x}px,${y}px)`;
        sessionStorage.setItem('__classall-pointer',JSON.stringify({x,y}));
      };
      move(position?.x ?? innerWidth-72,position?.y ?? innerHeight-72);
      addEventListener('pointermove', e => move(e.clientX,e.clientY),true);
      addEventListener('pointerdown', e => {
        if(!e.isTrusted) return;
        move(e.clientX,e.clientY);
        const ring=document.createElement('span');ring.className='ring';
        ring.style.left=e.clientX+'px';ring.style.top=e.clientY+'px';shadow.append(ring);
        setTimeout(()=>ring.remove(),800);
        window.__classallPointerEvent({type:'click',x:e.clientX,y:e.clientY,trusted:e.isTrusted}).catch(()=>{});
      },true);
    };
    if(document.documentElement) mount(); else addEventListener('DOMContentLoaded',mount,{once:true});
  });
}
function direct(page, onEvent) {
  const cache=new WeakMap();
  let x=1848,y=1008;
  function wrap(target) {
    if(cache.has(target)) return cache.get(target);
    const proxy=new Proxy(target,{get(obj,key) {
      const value=Reflect.get(obj,key,obj);
      if(typeof value!=='function') return value;
      return (...args) => {
        if(['click','check','uncheck'].includes(key) && typeof obj.boundingBox==='function') {
          return (async()=>{
            await obj.scrollIntoViewIfNeeded();
            const box=await obj.boundingBox();
            if(!box) throw Error('Cannot direct an invisible interaction');
            const endX=box.x+box.width/2,endY=box.y+box.height/2;
            for(let i=1;i<=18;i++) {
              const t=i/18, eased=t*t*(3-2*t);
              await page.mouse.move(x+(endX-x)*eased,y+(endY-y)*eased);
              await page.waitForTimeout(16);
            }
            x=endX;y=endY;
            const description=await obj.getAttribute('aria-label') || (await obj.textContent() || '').trim().slice(0,180);
            const semantic=String(obj);
            // English locator names are supplied separately by the story; Spanish DOM stays intact.
            if(important.test(semantic) || important.test(description)) onEvent({type:'important',label:description || semantic});
            const result=await value.apply(obj,args);
            // Let the true click ring register, then leave the text readable.
            await page.waitForTimeout(550);
            await page.mouse.move(1848,1008,{steps:12});
            x=1848;y=1008;
            return result;
          })();
        }
        const result=value.apply(obj,args);
        if(result && typeof result.boundingBox==='function') return wrap(result);
        if(key==='all') return result.then(items=>items.map(wrap));
        return result;
      };
    }});
    cache.set(target,proxy);return proxy;
  }
  return wrap(page);
}
module.exports={installCursor,direct};
