/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  const M = MWCount.model, D = MWCount.data;
  const copy = M.clone;
  const nucleotideRegex = new RegExp("^(" + D.tokenPattern + ")", "u");
  function check(ts) {
    if (!Array.isArray(ts)) throw new Error("Invalid drawing.");
    if (ts.length > D.maxNucleotides * 2 + 1 || ts.filter(t=>t.kind==="nucleotide").length>D.maxNucleotides) throw new Error("Drawing is too long.");
    for (const t of ts) {
      if (t.kind === "nucleotide") {
        if (!D.chemistries[t.chemistry]?.bases.includes(t.base)) throw new Error("Unsupported nucleotide.");
      } else if (t.kind !== "link" || !Object.hasOwn(D.linkageFragments, t.type)) throw new Error("Unsupported linkage.");
    }
    return ts;
  }
  function normalize(ts) {
    const out = [];
    for (const t of check(ts)) {
      if (t.kind === "nucleotide" && out.at(-1)?.kind === "nucleotide") out.push({kind:"link",type:D.defaultLinkage});
      out.push({...t});
    }
    return check(out);
  }
  function analyze(ts) {
    check(ts);
    const invalid = new Set();
    if (ts[0]?.kind === "link") invalid.add(0);
    if (ts.at(-1)?.kind === "link") invalid.add(ts.length - 1);
    ts.forEach((t,i) => { if (i && t.kind === ts[i-1].kind) {invalid.add(i-1);invalid.add(i);} });
    if (invalid.size) return {valid:false,sequence:null,invalidIndexes:[...invalid],message:ts.at(-1)?.kind === "link" ? "Open 3′ end: add a nucleotide after the linkage, or remove the linkage." : ts[0]?.kind === "link" ? "Open 5′ end: add a nucleotide before the linkage, or remove the linkage." : "Two linkages cannot connect directly. Insert a nucleotide between them or remove a linkage."};
    try {return {valid:true,sequence:M.fromTokens(ts),invalidIndexes:[],message:""};}
    catch(e) {return {valid:false,sequence:null,invalidIndexes:[],message:e.message};}
  }
  const serialize = ts => check(ts).map(t => t.kind === "link" ? (t.type === "PS" ? "-(s)-" : "-") : MWCount.serializer.nucleotide(t)).join("");
  function parse(text) {
    const ts=[]; let pos=0;
    while (pos < text.length) {
      if (/\s/u.test(text[pos])) {pos++;continue;}
      const match = /^(?:-\s*\(\s*[sS]\s*\)\s*-|-)/u.exec(text.slice(pos)) || nucleotideRegex.exec(text.slice(pos));
      if (!match) return null;
      const value=match[0];pos+=value.length;
      if (value[0]==="-") ts.push({kind:"link",type:/[sS]/u.test(value)?"PS":"PO"});
      else {
        ts.push({kind:"nucleotide",...D.tokenDefinitions[value]});
      }
    }
    if(ts.some((t,i)=>i&&t.kind==="nucleotide"&&ts[i-1].kind==="nucleotide"))return null;
    try {check(ts);return ts;} catch {return null;}
  }
  function insert(ts, token, slot) {
    if (!Number.isInteger(slot) || slot<0 || slot>ts.length) throw new Error("Invalid insertion position.");
    const out=copy(ts);out.splice(slot,0,token);return normalize(out);
  }
  const position = (ts, ordinal) => {const indexes=ts.flatMap((t,i)=>t.kind==="nucleotide"?[i]:[]);if(indexes[ordinal]===undefined)throw new Error("Invalid nucleotide position.");return indexes[ordinal];};
  function removalMask(ts, center) {return ts.map((t,i)=>i===center || (t.kind==="link" && Math.abs(i-center)===1));}
  function remove(ts, ordinal) {const mask=removalMask(ts,position(ts,ordinal));return normalize(ts.filter((_,i)=>!mask[i]));}
  function move(ts, ordinal, slot) {
    const center=position(ts,ordinal);
    if (!Number.isInteger(slot)||slot<0||slot>ts.length) throw new Error("Invalid insertion position.");
    if(slot===center||slot===center+1)return copy(ts);
    const mask=removalMask(ts,center),out=[];
    for(let i=0;i<=ts.length;i++){if(i===slot)out.push(ts[center]);if(i<ts.length&&!mask[i])out.push(ts[i]);}
    return normalize(out);
  }
  function update(ts, ordinal, n) {const out=copy(ts);out[position(ts,ordinal)]={kind:"nucleotide",...n};return check(out);}
  function setLink(ts, index, type) {const out=copy(ts);if(out[index]?.kind!=="link")throw new Error("Invalid linkage position.");out[index]={kind:"link",type};return check(out);}
  function removeLink(ts,index){if(ts[index]?.kind!=="link")throw new Error("Invalid linkage position.");return normalize(ts.filter((_,i)=>i!==index));}
  MWCount.builder={check,normalize,analyze,serialize,parse,insert,remove,move,update,setLink,removeLink,position};
})();
