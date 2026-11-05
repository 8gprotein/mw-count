/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  const D = MWCount.data;
  function calculate(s) {
    MWCount.model.validate(s);
    if (!s.nucleotides.length) return null;
    const composition = {};
    const add = f => { for (const [element, count] of Object.entries(f)) composition[element] = (composition[element] || 0) + count; };
    for (const n of s.nucleotides) add(D.nucleotideFragments[MWCount.serializer.nucleotide(n)]);
    for (const l of s.linkages) add(D.linkageFragments[l.type]);
    add(D.terminalFragments.fivePrime[s.fivePrimeTerminus]);
    add(D.terminalFragments.threePrime[s.threePrimeTerminus]);
    for (const [e, count] of Object.entries(composition)) {
      if (!Number.isSafeInteger(count) || count < 0 || !D.atomicMasses[e]) throw new Error("Invalid elemental composition.");
      if (count === 0) delete composition[e];
    }
    const elements = Object.keys(composition).sort((a, b) => {
      const priority = e => e === "C" ? 0 : e === "H" ? 1 : 2;
      return priority(a) - priority(b) || a.localeCompare(b, "en");
    });
    const formula = elements.map(e => e + (composition[e] === 1 ? "" : composition[e])).join("");
    let average = 0, monoisotopic = 0;
    for (const e of elements) { average += composition[e] * D.atomicMasses[e].average; monoisotopic += composition[e] * D.atomicMasses[e].mono; }
    return { composition, elements, formula, average, monoisotopic };
  }
  MWCount.mass = { calculate };
})();
