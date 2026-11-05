/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  const token=MWCount.serializer.nucleotide;
  function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function nucleotide(n,index,interactive=true){
    const el=node(interactive?"button":"span","nucleotide",token(n));el.dataset.chemistry=n.chemistry;el.style.setProperty("--ink",MWCount.data.chemistries[n.chemistry].color || "#235caf");
    el.title=token(n)+" · "+MWCount.data.chemistries[n.chemistry].label+(index!==undefined?" · Position "+(index+1):"");
    if(interactive){el.type="button";el.draggable=true;}return el;
  }
  function slot(index){
    const el=node("button","insert-slot","");el.type="button";el.dataset.slot=String(index);el.tabIndex=-1;
    el.title="Insert at this position";el.setAttribute("aria-label",el.title);return el;
  }
  function terminus(side,open,slotIndex,interactive,fivePrimeTerminus="OH",onLeft=side==="five-prime"){
    const el=node("span","terminus "+side+(open?" open-end":""));
    el.append(node("small","",side==="five-prime"?"5′":"3′"));
    if(side==="five-prime"&&!open&&interactive){
      const select=node("select","five-prime-select");select.dataset.fivePrime="true";select.setAttribute("aria-label","5′ protecting group");
      for(const [value,label] of [["OH","H"],["DMT","DMT"]]){const option=node("option","",label);option.value=value;select.append(option);}
      select.value=fivePrimeTerminus;el.append(node("span","terminal-text",fivePrimeTerminus==="DMT"?"DMT–O":"HO"),select);
    }else el.append(node("span","",open?"?":side==="five-prime"&&fivePrimeTerminus==="DMT"?(onLeft?"DMT–O":"O–DMT"):(onLeft?"HO":"OH")));
    el.title=open?"Open end — add a nucleotide":side==="five-prime"?"H = 5′-OH; DMT = 5′-O-dimethoxytrityl":"3′-OH";
    if(interactive)el.dataset.slot=String(slotIndex);return el;
  }
  const views=new WeakMap();
  function fit(container){
    const state=views.get(container);if(!state)return;
    const peer=document.getElementById(container.id==="primary-workspace"?"complement-workspace":"primary-workspace");
    const containers=[container];
    if(peer&&views.has(peer)&&!peer.closest("[hidden]")&&peer.querySelector(".wrapped-strand")&&!container.closest("[hidden]"))containers.push(peer);
    const groups=containers.map(c=>[...c.querySelectorAll(".wrapped-strand")]);
    const rows=groups.flat();if(!rows.length)return;
    // Equal terminal widths keep paired bases aligned, including primary 5′-DMT.
    for(const row of rows)for(const el of row.querySelectorAll(".terminus"))el.style.minWidth="";
    for(const edge of ["firstElementChild","lastElementChild"]){
      const ends=rows.map(row=>row[edge]).filter(el=>el.classList.contains("terminus"));
      const width=Math.max(0,...ends.map(el=>el.offsetWidth));
      for(const el of ends)el.style.minWidth=width+"px";
    }
    const widths=Array.from({length:Math.max(...groups.map(g=>g.length))},(_,i)=>Math.max(...groups.map(g=>g[i]?.scrollWidth||0)));
    const available=Math.max(0,Math.min(...containers.map(c=>{const style=getComputedStyle(c);return c.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);})));
    const natural=Math.max(...widths);
    const scale=MWCount.layout.scale(available,natural);
    for(const group of groups)for(const [i,row] of group.entries()){
      row.style.transform="scale("+scale+")";
      row.style.top=22*scale+"px";
      row.parentElement.style.width=widths[i]*scale+"px";
      row.parentElement.style.height=(row.offsetHeight+44)*scale+"px";
    }
    for(const c of containers)c.dataset.scale=scale.toFixed(4);
  }
  const resize=typeof ResizeObserver!=="undefined"?new ResizeObserver(entries=>entries.forEach(e=>fit(e.target))):null;
  function strand(container,sequence,{interactive=false,selected=null,drawing=null,fivePrimeTerminus=sequence.fivePrimeTerminus,reverse=false}={}){
    const oldScroll=container.scrollTop,known=views.has(container);
    const capacity=MWCount.layout.capacity(container.clientWidth-24);
    views.set(container,{sequence,options:{interactive,selected,drawing,fivePrimeTerminus,reverse},capacity});
    if(resize&&!known)resize.observe(container);
    container.replaceChildren();container.dataset.perRow=String(capacity);
    const original=drawing??MWCount.model.tokens(sequence);
    const ts=MWCount.layout.displayTokens(original,reverse),a=MWCount.builder.analyze(ts);
    const count=ts.filter(t=>t.kind==="nucleotide").length;
    container.classList.toggle("invalid-drawing",!a.valid);
    if(!ts.length){
      if(interactive){const empty=node("div","empty-workspace"),add=slot(0);add.textContent="+";add.tabIndex=0;add.classList.add("empty-add");empty.append(add,node("p","","Add a nucleotide"));container.append(empty);}return;
    }
    const chunks=MWCount.layout.rows(ts,capacity),stack=node("div","strand-stack");
    stack.classList.toggle("multiline",chunks.length>1);
    let ordinal=0;
    const gap=index=>interactive?slot(index):node("span","bond");
    chunks.forEach((chunk,r)=>{
      const first=r===0,last=r===chunks.length-1;
      const line=node("div","strand-line");
      const meta=node("div","row-meta",chunk.last>=chunk.first?(reverse?(count-chunk.first+1)+"–"+(count-chunk.last+1):chunk.first+"–"+chunk.last):"Draft");
      const row=node("div","wrapped-strand");
      row.append(first?terminus(reverse?"three-prime":"five-prime",ts[0].kind==="link",0,interactive,fivePrimeTerminus,true):node("span","continuation incoming","↳"));
      row.append(gap(chunk.start));
      for(let i=chunk.start;i<chunk.end;i++){
        const t=ts[i];
        if(t.kind==="nucleotide"){
          const displayIndex=reverse?count-ordinal-1:ordinal;
          const bead=nucleotide(t,displayIndex,interactive);bead.dataset.index=String(displayIndex);
          if(selected===ordinal&&interactive)bead.classList.add("selected");
          ordinal++;bead.append(node("small","",String(displayIndex+1)));row.append(bead);
        }else{
          const wrapper=node("span","link-wrapper"+(a.invalidIndexes.includes(i)?" invalid-link":""));
          const link=node(interactive?"button":"span","connector");link.dataset.linkToken=String(i);
          link.title=t.type+(interactive?" · Click to toggle":"");link.setAttribute("aria-label",t.type+" linkage");
          link.append(node("span","link-dot "+t.type.toLowerCase()));wrapper.append(link);
          if(interactive){const del=node("button","remove-link","×");del.dataset.removeLink=String(i);del.title="Remove linkage";del.setAttribute("aria-label","Remove "+t.type+" linkage");wrapper.append(del);}
          row.append(wrapper);
        }
        // No linker or duplicate drop slot at the end of a continued row.
        if(i+1<chunk.end||last)row.append(gap(i+1));
      }
      if(last)row.append(terminus(reverse?"five-prime":"three-prime",ts.at(-1).kind==="link",ts.length,interactive,fivePrimeTerminus,false));
      else {const marker=node("span","continuation outgoing","↘ "+(reverse?count-chunk.last:chunk.last+1));marker.title="Continue on the next row, starting with the linkage";row.append(marker);}
      const viewport=node("div","row-viewport");viewport.append(row);
      line.append(meta,viewport);stack.append(line);
    });
    container.append(stack);fit(container);container.scrollTop=oldScroll;
  }
  function properties(container,result,precision,{invalid=false}={}){
    container.replaceChildren();
    if(invalid){container.append(node("span","invalid-property","Invalid"));return;}
    const group=node("dl","mass-values");
    for(const [label,value,unit] of [
      ["Molecular Weight",result?.average.toFixed(precision),"g/mol"],
      ["Monoisotopic Exact Mass",result?.monoisotopic.toFixed(precision),"Da"]
    ]){
      const item=node("div","mass-item"),valueNode=node("dd","",value||"—");
      if(value)valueNode.append(node("span","table-unit"," "+unit));
      item.append(node("dt","",label),valueNode);group.append(item);
    }
    container.append(group);
  }
  MWCount.view={node,nucleotide,strand,properties,fit};
})();
