/* designed/corrected by YZ, implemented by openAI */
/* Browser scripts use a single namespace so index.html also works via file://.
 * No runtime dependencies, network imports, eval, or build step. */
"use strict";
globalThis.MWCount = globalThis.MWCount || {};
(() => {
  if (typeof module !== "undefined" && module.exports) {
    require("./massData.js"); require("./chemistryCatalog.js"); require("./linkageData.js");
  }
  const massData = MWCount.massData;
  if (!massData) throw new Error("Missing massData.js. Keep it alongside the other data files.");
  const atomicMasses = massData.atomicMasses;
  if (!atomicMasses || !massData.nucleosides || !massData.linkageFragments || !massData.terminalFragments) {
    throw new Error("Incomplete massData.js configuration.");
  }
  for (const [element, values] of Object.entries(atomicMasses)) {
    if (!/^[A-Z][a-z]?$/.test(element) || !values || !Number.isFinite(values.average) || values.average <= 0 ||
        !Number.isFinite(values.mono) || values.mono <= 0) throw new Error("Invalid atomic mass: " + element);
  }
  function checkFormula(formula, name) {
    if (!formula || typeof formula !== "object" || !Object.keys(formula).length) throw new Error("Missing formula: " + name);
    for (const [element, count] of Object.entries(formula)) {
      if (!atomicMasses[element] || !Number.isSafeInteger(count) || count < 0) throw new Error("Invalid formula: " + name);
    }
  }
  for (const [token, formula] of Object.entries(massData.nucleosides)) checkFormula(formula, token);
  for (const [name, formula] of Object.entries(massData.linkageFragments)) checkFormula(formula, name);
  for (const [end, choices] of Object.entries(massData.terminalFragments)) {
    for (const [name, formula] of Object.entries(choices)) checkFormula(formula, end + "." + name);
  }
  const chemistries = MWCount.chemistryCatalog;
  const nucleosides = {}, tokenDefinitions = {}, resolving = new Set(), resolved = new Set();
  function resolve(key) {
    if (resolved.has(key)) return;
    if (resolving.has(key) || !chemistries[key]) throw new Error("Invalid chemistry dependency: " + key);
    resolving.add(key);
    const c = chemistries[key];
    if (!/^[a-z]+$/.test(c.prefix)) throw new Error("Chemistry prefixes must use lowercase letters.");
    if (c.derivesFrom) resolve(c.derivesFrom);
    for (const base of c.bases) {
      if (!c.bases.includes(c.complement[base])) throw new Error("Missing complement: " + key + base);
      const token = c.prefix + base;
      if (tokenDefinitions[token]) throw new Error("Duplicate nucleotide token: " + token);
      const source = massData.nucleosides[token] || c.monomers?.[base] || nucleosides[chemistries[c.derivesFrom]?.prefix + base];
      if (!source) throw new Error("Missing monomer: " + token);
      const f = {...source};
      for (const [e,n] of Object.entries(massData.chemistryDeltas?.[key] || c.delta || {})) f[e] = (f[e] || 0) + n;
      checkFormula(f, token);
      if (f.H < 2 || f.O < 2) throw new Error("Nucleoside must contain two terminal OH groups: " + token);
      nucleosides[token] = f; tokenDefinitions[token] = {chemistry:key,base};
    }
    resolving.delete(key); resolved.add(key);
  }
  Object.keys(chemistries).forEach(resolve);
  const tokenPattern = Object.keys(tokenDefinitions).sort((a,b)=>b.length-a.length).join("|");
  // Fragment convention: remove 5′-OH and 3′-OH from EACH nucleoside.
  // Each bridge owns its two ester oxygens. Add the two terminal OH once.
  // PO = HPO4; PS = HPO3S. Equivalent: sum complete nucleosides
  // + (n-1)*(PO2-H), and for every PS replace O by S.
  const nucleotideFragments = Object.fromEntries(Object.entries(nucleosides).map(([token, f]) => [token, { ...f, H: f.H - 2, O: f.O - 2 }]));
  const data = {
    version: "1.0.0", atomicMasses, chemistries, nucleosides, nucleotideFragments, tokenDefinitions, tokenPattern,
    linkageFragments: massData.linkageFragments,
    terminalFragments: massData.terminalFragments,
    defaultLinkage: "PO", defaultPrecision: 4, maxNucleotides: 2000,
    examples: { mixed: "dA-dC-(s)-mG-fU-rA-(s)-rC" },
    sources: ["https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl", "https://pubchem.ncbi.nlm.nih.gov/compound/Deoxyadenosine", "https://pubchem.ncbi.nlm.nih.gov/compound/Adenosine"]
  };
  function freezeDeep(obj) { Object.values(obj).forEach(v => { if (v && typeof v === "object") freezeDeep(v); }); return Object.freeze(obj); }
  MWCount.data = freezeDeep(data);
})();
