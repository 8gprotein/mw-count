/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  function attach(root,state,handleError) {
    const workspace=root.querySelector("#primary-workspace"),B=MWCount.builder;
    let payload=null;
    const cleanup=()=>{
      workspace.classList.remove("dragging-nucleotide","dragging-link");
      root.querySelectorAll(".drop-active").forEach(el=>el.classList.remove("drop-active"));
    };
    function visibility(event){
      const inside=workspace.contains(event.target);
      workspace.classList.toggle("dragging-nucleotide",!!(inside&&payload&&payload.kind!=="link"));
      workspace.classList.toggle("dragging-link",!!(inside&&payload?.kind==="link"));
    }
    const targetFor=event=>event.target.closest(payload?.kind==="link"
      ? "#primary-workspace [data-link-token], #primary-workspace [data-slot]"
      : "#primary-workspace [data-slot]");
    root.addEventListener("dragenter",visibility);
    workspace.addEventListener("dragleave",e=>{if(!e.relatedTarget||!workspace.contains(e.relatedTarget))cleanup();});
    root.addEventListener("dragstart",e=>{
      const lib=e.target.closest("#library-items .nucleotide"),existing=e.target.closest("#primary-workspace .nucleotide"),link=e.target.closest(".link-choice");
      payload=lib?{kind:"new",nucleotide:{chemistry:lib.dataset.chemistry,base:lib.dataset.base}}
        :existing?{kind:"move",index:Number(existing.dataset.index)}
        :link?{kind:"link",type:link.dataset.link}:null;
      if(!payload||state.get().textError){e.preventDefault();payload=null;return;}
      e.dataTransfer.setData("text/plain","MW Count "+payload.kind);
      e.dataTransfer.effectAllowed=payload.kind==="move"?"move":"copy";
    });
    root.addEventListener("dragover",e=>{
      if(!payload)return;visibility(e);
      if(workspace.contains(e.target)){
        const bounds=workspace.getBoundingClientRect();
        if(e.clientY<bounds.top+28)workspace.scrollTop-=14;
        else if(e.clientY>bounds.bottom-28)workspace.scrollTop+=14;
      }
      const target=targetFor(e);
      root.querySelectorAll(".drop-active").forEach(el=>{if(el!==target)el.classList.remove("drop-active");});
      if(!target)return;e.preventDefault();e.dataTransfer.dropEffect=payload.kind==="move"?"move":"copy";target.classList.add("drop-active");
    });
    root.addEventListener("drop",e=>{
      if(!payload)return;const target=targetFor(e),drop=payload;payload=null;cleanup();
      if(!target)return;e.preventDefault();
      try{state.build(ts=>drop.kind==="link"
        ? target.dataset.linkToken!==undefined?B.setLink(ts,Number(target.dataset.linkToken),drop.type):B.insert(ts,{kind:"link",type:drop.type},Number(target.dataset.slot))
        :drop.kind==="move"?B.move(ts,drop.index,Number(target.dataset.slot))
        :B.insert(ts,{kind:"nucleotide",...drop.nucleotide},Number(target.dataset.slot)));}
      catch(error){handleError(error);}
    });
    root.addEventListener("dragend",()=>{payload=null;cleanup();});
  }
  MWCount.dragDrop={attach};
})();
