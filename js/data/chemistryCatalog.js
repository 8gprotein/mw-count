/* designed/corrected by YZ, implemented by openAI */
"use strict";
globalThis.MWCount = globalThis.MWCount || {};
// Chemistry names, token grammar, colors, and complements. Mass inputs live in massData.js.
MWCount.chemistryCatalog = {
  DNA: {
    prefix: "d", label: "DNA", description: "2′-Deoxyribose", color: "#235caf",
    bases: ["A","C","G","T"], complement: { A:"T",T:"A",C:"G",G:"C" }
  },
  RNA: {
    prefix: "r", label: "RNA", description: "Ribose · 2′-OH", color: "#007768",
    bases: ["A","C","G","U"], complement: { A:"U",U:"A",C:"G",G:"C" }
  },
  "2OMe": {
    prefix:"m", label:"2′-OMe", description:"2′-O-Methylribose",color:"#8244a4",
    bases:["A","C","G","U"],complement:{A:"U",U:"A",C:"G",G:"C"},
    derivesFrom:"RNA"
  },
  "2F": {
    prefix:"f",label:"2′-F",description:"2′-Fluororibose",color:"#a65c0b",
    bases:["A","C","G","U"],complement:{A:"U",U:"A",C:"G",G:"C"},
    derivesFrom:"RNA"
  }
};
