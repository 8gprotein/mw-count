/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  function create() {
    const M=MWCount.model,B=MWCount.builder;
    let sequence=M.empty(), drawing=[],draft="",error=null,textError=false,selected=null,fivePrimeTerminus="OH";
    let chemistry="DNA",picked={chemistry:"DNA",base:"A"},complementOpen=false,precision=4;
    const undo=[],redo=[],listeners=[];
    const snapshot=()=>({drawing:M.clone(drawing),draft,error:error?{...error}:null,textError,complementOpen,fivePrimeTerminus});
    const get=()=>({sequence:M.clone(sequence),drawing:M.clone(drawing),draft,error,textError,selected,chemistry,picked:{...picked},complementOpen,precision,fivePrimeTerminus,canUndo:!!undo.length,canRedo:!!redo.length});
    const notify=()=>listeners.forEach(fn=>fn(get()));
    const save=()=>{undo.push(snapshot());if(undo.length>100)undo.shift();redo.length=0;};
    function derive() {
      const a=B.analyze(drawing);sequence=a.valid?a.sequence:M.empty();
      if(a.valid)sequence.fivePrimeTerminus=fivePrimeTerminus;
      error=a.valid?null:{position:draft.length,message:a.message};textError=false;
    }
    function text(value) {
      if(value===draft)return;
      save();draft=value;selected=null;if(!value.trim()){complementOpen=false;fivePrimeTerminus="OH";}
      const p=MWCount.parser.parse(value);
      if(p.ok){drawing=M.tokens(p.sequence);derive();}
      else {
        const loose=B.parse(value);
        // Preserve recognized incomplete drawings, but never silently accept missing separators.
        if(loose && !B.analyze(loose).valid){drawing=loose;derive();}
        else {drawing=[];sequence=M.empty();error=p.error;textError=true;}
      }
      notify();
    }
    function build(operation) {
      if(textError)return;
      const next=B.check(operation(M.clone(drawing)));
      if(JSON.stringify(next)===JSON.stringify(drawing))return;
      save();drawing=next;draft=B.serialize(drawing);selected=null;if(!drawing.length)fivePrimeTerminus="OH";derive();notify();
    }
    function edit(operation) {
      if(error)return;
      build(()=>M.tokens(M.validate(operation(M.clone(sequence)))));
    }
    function travel(from,to) {
      if(!from.length)return;to.push(snapshot());const v=from.pop();
      drawing=v.drawing;draft=v.draft;complementOpen=v.complementOpen;fivePrimeTerminus=v.fivePrimeTerminus;selected=null;
      if(v.textError){textError=true;error=v.error;sequence=M.empty();}else derive();
      notify();
    }
    return {get,text,edit,build,
      setFivePrime(value){
        if(!Object.hasOwn(MWCount.data.terminalFragments.fivePrime,value))throw new Error("Unsupported 5′ group.");
        if(textError||drawing[0]?.kind!=="nucleotide"||value===fivePrimeTerminus)return;
        save();fivePrimeTerminus=value;derive();notify();
      },
      subscribe(fn){listeners.push(fn);fn(get());},
      select(i){selected=i;notify();},
      pick(n){picked={...n};chemistry=n.chemistry;notify();},
      setChemistry(c){chemistry=c;picked={chemistry:c,base:MWCount.data.chemistries[c].bases[0]};notify();},
      toggleComplement(){if(complementOpen||(!error&&sequence.nucleotides.length)){complementOpen=!complementOpen;notify();}},
      setPrecision(v){if([2,4,6].includes(v)){precision=v;notify();}},
      undo(){travel(undo,redo);},redo(){travel(redo,undo);}
    };
  }
  MWCount.state={create};
})();
