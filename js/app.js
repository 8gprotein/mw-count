/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  const $=id=>document.getElementById(id),D=MWCount.data,M=MWCount.model,B=MWCount.builder,V=MWCount.view;
  const state=MWCount.state.create(),input=$("sequence-input"),workspace=$("primary-workspace");
  const report=e=>{$("input-error").hidden=false;$("input-error").textContent=e.message;};
  const edit=fn=>{try{state.build(fn);}catch(e){report(e);}};
  function options(select,choices,selected){select.replaceChildren(...choices.map(([value,label])=>{const o=V.node("option","",label);o.value=value;return o;}));select.value=selected;}
  const chemistryChoices=Object.entries(D.chemistries).map(([k,c])=>[k,c.label]);
  chemistryChoices.forEach(([key,label])=>{const b=V.node("button","",label);b.dataset.chemistry=key;b.addEventListener("click",()=>state.setChemistry(key));$("chemistry-tabs").append(b);});
  state.subscribe(s=>{
    const displayed=s.draft.trim()?"5'-"+s.draft+"-3'":"";
    if(input.value!==displayed)input.value=displayed;
    input.setAttribute("aria-invalid",String(!!s.error));
    $("input-error").hidden=!s.error;
    $("input-error").textContent=s.error?s.error.message:"";
    $("input-status").textContent=s.error?"Invalid · finish the drawing":s.sequence.nucleotides.length?"✓ Valid sequence":"No sequence";
    $("undo").disabled=!s.canUndo;$("redo").disabled=!s.canRedo;
    $("chemistry-tabs").querySelectorAll("button").forEach(b=>{const active=b.dataset.chemistry===s.chemistry;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
    $("chemistry-description").textContent=D.chemistries[s.chemistry].description;
    $("library-items").replaceChildren(...D.chemistries[s.chemistry].bases.map(base=>{
      const n={chemistry:s.chemistry,base},b=V.nucleotide(n);b.dataset.base=base;
      const active=s.picked.base===base&&s.picked.chemistry===s.chemistry;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active));b.addEventListener("click",()=>state.pick(n));return b;
    }));
    $("picked-label").textContent="Selected "+MWCount.serializer.nucleotide(s.picked)+" · Drag to insert";
    const nts=s.drawing.filter(t=>t.kind==="nucleotide"),links=s.drawing.filter(t=>t.kind==="link");
    const n=nts.length,ps=links.filter(t=>t.type==="PS").length;
    $("sequence-count").textContent=n+" nucleotides · "+links.length+" linkages · "+ps+" PS";
    $("drawing-status").hidden=!s.error;
    $("drawing-status").textContent=s.error?"Invalid — "+s.error.message:"";
    V.strand(workspace,s.sequence,{interactive:!s.textError,selected:s.selected,drawing:s.drawing,fivePrimeTerminus:s.fivePrimeTerminus});
    workspace.classList.toggle("invalid-drawing",!!s.error);
    const valid=!!(!s.error&&n);
    V.properties($("primary-properties"),valid?MWCount.mass.calculate(s.sequence):null,s.precision,{invalid:!!s.error});
    $("selection-editor").hidden=s.selected===null||s.textError;
    if(s.selected!==null&&!s.textError){
      const current=nts[s.selected];
      $("selection-title").textContent="Position "+(s.selected+1)+" · "+MWCount.serializer.nucleotide(current);
      options($("edit-chemistry"),chemistryChoices,current.chemistry);
      options($("edit-base"),D.chemistries[current.chemistry].bases.map(b=>[b,b]),current.base);
      $("move-left").disabled=s.selected===0;$("move-right").disabled=s.selected===n-1;
    }
    $("toggle-complement").disabled=!valid&&!s.complementOpen;
    $("toggle-complement").textContent=s.complementOpen?"Hide reverse complement":"Reverse complement";
    $("toggle-complement").setAttribute("aria-pressed",String(s.complementOpen));
    $("complement-content").hidden=!s.complementOpen||!valid;
    $("complement-property-card").hidden=!s.complementOpen;
    if(s.complementOpen&&valid){
      const c=MWCount.complement.generate(s.sequence);
      $("complement-text").textContent=MWCount.serializer.serialize(c);
      V.strand($("complement-workspace"),c,{reverse:true});
      V.properties($("complement-properties"),MWCount.mass.calculate(c),s.precision);
    }else{
      $("complement-text").textContent="";$("complement-workspace").replaceChildren();
      V.properties($("complement-properties"),null,s.precision,{invalid:!!s.error});
    }
    V.fit(workspace);
  });
  // Direction labels are automatic; keep the caret inside the editable sequence.
  input.addEventListener("beforeinput",()=>{
    if(!input.value.startsWith("5'-")||!input.value.endsWith("-3'"))return;
    const end=input.value.length-3;
    input.setSelectionRange(Math.max(3,Math.min(end,input.selectionStart)),Math.max(3,Math.min(end,input.selectionEnd)));
  });
  input.addEventListener("keydown",e=>{
    if(!input.value)return;
    if(input.selectionStart===input.selectionEnd&&((e.key==="Backspace"&&input.selectionStart<=3)||(e.key==="Delete"&&input.selectionEnd>=input.value.length-3)))e.preventDefault();
  });
  input.addEventListener("input",()=>{
    const raw=input.value,offset=raw.startsWith("5'-")?3:0;
    const start=Math.max(0,input.selectionStart-offset),end=Math.max(0,input.selectionEnd-offset);
    const value=raw.slice(offset).replace(/^(?:5['′]-)+/u,"").replace(/(?:-3['′])+$/u,"").replace(/\(\s*S\s*\)/gu,"(s)");
    state.text(value);
    // Also restore labels after deleting only a direction label.
    input.value=value.trim()?"5'-"+value+"-3'":"";
    if(input.value)input.setSelectionRange(3+Math.min(start,value.length),3+Math.min(end,value.length));
  });
  workspace.addEventListener("change",e=>{
    if(e.target.matches("[data-five-prime]")){try{state.setFivePrime(e.target.value);}catch(error){report(error);}}
  });
  $("example").addEventListener("click",()=>state.text(D.examples.mixed));
  $("clear").addEventListener("click",()=>state.text(""));
  $("clear-workspace").addEventListener("click",()=>state.text(""));
  $("undo").addEventListener("click",()=>state.undo());$("redo").addEventListener("click",()=>state.redo());
  $("toggle-complement").addEventListener("click",()=>state.toggleComplement());
  $("precision").addEventListener("change",e=>state.setPrecision(Number(e.target.value)));
  workspace.addEventListener("click",e=>{
    const target=e.target.closest("button");if(!target)return;
    if(target.dataset.removeLink!==undefined)edit(ts=>B.removeLink(ts,Number(target.dataset.removeLink)));
    else if(target.dataset.index!==undefined)state.select(Number(target.dataset.index));
    else if(target.dataset.linkToken!==undefined){const i=Number(target.dataset.linkToken);edit(ts=>B.setLink(ts,i,ts[i].type==="PO"?"PS":"PO"));}
    else if(target.dataset.slot!==undefined)edit(ts=>B.insert(ts,{kind:"nucleotide",...state.get().picked},Number(target.dataset.slot)));
  });
  $("delete-selected").addEventListener("click",()=>{const i=state.get().selected;if(i!==null)edit(ts=>B.remove(ts,i));});
  $("edit-chemistry").addEventListener("change",e=>{
    const s=state.get(),i=s.selected;if(i===null)return;
    const chemistry=e.target.value;let base=s.drawing[B.position(s.drawing,i)].base;
    if(!D.chemistries[chemistry].bases.includes(base))base=base==="T"?"U":"T";
    edit(ts=>B.update(ts,i,{chemistry,base}));state.select(i);
  });
  $("edit-base").addEventListener("change",e=>{
    const s=state.get(),i=s.selected;if(i===null)return;
    const n=s.drawing[B.position(s.drawing,i)];
    edit(ts=>B.update(ts,i,{chemistry:n.chemistry,base:e.target.value}));state.select(i);
  });
  $("move-left").addEventListener("click",()=>{const i=state.get().selected;if(i>0){edit(ts=>B.move(ts,i,B.position(ts,i-1)));state.select(i-1);}});
  $("move-right").addEventListener("click",()=>{const s=state.get(),i=s.selected,n=s.drawing.filter(t=>t.kind==="nucleotide").length;if(i!==null&&i<n-1){edit(ts=>B.move(ts,i,B.position(ts,i+1)+1));state.select(i+1);}});
  document.addEventListener("keydown",e=>{
    if(e.target.matches("textarea,input,select"))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?state.redo():state.undo();}
  });
  MWCount.dragDrop.attach(document,state,report);
})();
