import { useEffect, useId, useLayoutEffect, useRef } from 'react';
const rowHeight=40;
/** Native scroll/snap wheel: touch, mouse wheel, keyboard and direct option selection. */
export function WheelPicker({label,value,options,change}:{label:string;value:string;options:{value:string;label:string}[];change:(value:string)=>void}) {
 const ref=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),id=useId();
 const index=Math.max(0,options.findIndex(o=>o.value===value));
 const latest=useRef({options,change,value});latest.current={options,change,value};
 useLayoutEffect(()=>{const element=ref.current!;if(Math.abs(element.scrollTop-index*rowHeight)>1)element.scrollTop=index*rowHeight;},[index]);
 // A newly mounted dialog is still closed during layout effects; center again after showModal.
 useEffect(()=>{const frame=requestAnimationFrame(()=>{ref.current?.scrollTo({top:index*rowHeight});});return()=>cancelAnimationFrame(frame);},[index]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const select=(next:number)=>{const option=options[Math.max(0,Math.min(options.length-1,next))];change(option.value);};
 return <div className="wheel-field"><span className="field-label">{label}</span><div className="wheel-shell"><div className="wheel-selection" aria-hidden="true"/>
  <div ref={ref} className="scroll-wheel" role="listbox" aria-label={label} aria-activedescendant={`${id}-${index}`} tabIndex={0}
   onScroll={()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>{const current=latest.current;const i=Math.max(0,Math.min(current.options.length-1,Math.round(ref.current!.scrollTop/rowHeight)));if(current.options[i].value!==current.value)current.change(current.options[i].value);},100);}}
   onKeyDown={e=>{if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){e.preventDefault();if(e.key==='ArrowDown')select(index+1);if(e.key==='ArrowUp')select(index-1);if(e.key==='Home')select(0);if(e.key==='End')select(options.length-1);}}}>
   {options.map((option,i)=><div id={`${id}-${i}`} role="option" aria-selected={option.value===value} className={option.value===value?'selected':''} key={option.value} onClick={()=>select(i)}>{option.label}</div>)}
  </div>
 </div></div>;
}
