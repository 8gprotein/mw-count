/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  const D = MWCount.data;
  const clone = value => JSON.parse(JSON.stringify(value));
  const empty = () => ({ fivePrimeTerminus: "OH", nucleotides: [], linkages: [], threePrimeTerminus: "OH" });
  function validate(s) {
    if (!s || !Object.hasOwn(D.terminalFragments.fivePrime,s.fivePrimeTerminus) || s.threePrimeTerminus !== "OH") throw new Error("Supported termini: 5′-OH or 5′-O-DMT, and 3′-OH.");
    if (!Array.isArray(s.nucleotides) || !Array.isArray(s.linkages)) throw new Error("Incomplete sequence structure.");
    if (s.nucleotides.length > D.maxNucleotides) throw new Error(`Maximum length: ${D.maxNucleotides} nucleotides.`);
    if (s.linkages.length !== Math.max(0, s.nucleotides.length - 1)) throw new Error("Nucleotide and linkage counts do not match.");
    for (const n of s.nucleotides) if (!n || !D.chemistries[n.chemistry]?.bases.includes(n.base)) throw new Error("Unsupported nucleotide chemistry or base.");
    for (const l of s.linkages) if (!l || !Object.hasOwn(D.linkageFragments, l.type)) throw new Error("Unsupported linkage type.");
    return s;
  }
  function tokens(s) {
    validate(s);
    const out = [];
    s.nucleotides.forEach((n, i) => { if (i) out.push({ kind: "link", ...s.linkages[i - 1] }); out.push({ kind: "nucleotide", ...n }); });
    return out;
  }
  function fromTokens(ts, termini = {}) {
    const s = {...empty(),fivePrimeTerminus:termini.fivePrimeTerminus ?? "OH",threePrimeTerminus:termini.threePrimeTerminus ?? "OH"}; let previous = null;
    for (const t of ts) {
      if (t.kind === "nucleotide") {
        if (previous?.kind === "nucleotide") s.linkages.push({ type: D.defaultLinkage });
        s.nucleotides.push({ chemistry: t.chemistry, base: t.base });
      } else if (t.kind === "link" && previous?.kind === "nucleotide") s.linkages.push({ type: t.type });
      else throw new Error("A linkage must be between two nucleotides.");
      previous = t;
    }
    if (previous?.kind === "link") throw new Error("A strand cannot end with a linkage.");
    return validate(s);
  }
  function checkIndex(s, i) { validate(s); if (!Number.isInteger(i) || i < 0 || i >= s.nucleotides.length) throw new Error("Invalid nucleotide position."); }
  function insert(s, n, slot) {
    const ts = tokens(s);
    if (!Number.isInteger(slot) || slot < 0 || slot > ts.length) throw new Error("Invalid insertion position.");
    ts.splice(slot, 0, { kind: "nucleotide", ...n });
    return fromTokens(ts,s);
  }
  function remove(s, index) {
    checkIndex(s, index);
    return fromTokens(tokens(s).filter((_, j) => Math.abs(j - 2 * index) > 1),s);
  }
  function move(s, index, slot) {
    checkIndex(s, index);
    const ts = tokens(s), center = 2 * index;
    if (!Number.isInteger(slot) || slot < 0 || slot > ts.length) throw new Error("Invalid insertion position.");
    // Dropping immediately before/after itself is a no-op, preserving its links.
    if (slot === center || slot === center + 1) return clone(s);
    const remaining = [];
    // Insert at the chosen original boundary BEFORE reconnecting adjacent bases.
    for (let j = 0; j <= ts.length; j++) {
      if (j === slot) remaining.push(ts[center]);
      if (j < ts.length && Math.abs(j - center) > 1) remaining.push(ts[j]);
    }
    return fromTokens(remaining,s);
  }
  function update(s, index, n) { checkIndex(s, index); const out = clone(s); out.nucleotides[index] = { ...n }; return validate(out); }
  function setLink(s, index, type) {
    validate(s); if (!Number.isInteger(index) || index < 0 || index >= s.linkages.length) throw new Error("Invalid linkage position.");
    const out = clone(s); out.linkages[index] = { type }; return validate(out);
  }
  MWCount.model = { clone, empty, validate, tokens, fromTokens, insert, remove, move, update, setLink };
})();
