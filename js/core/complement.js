/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  function generate(s) {
    MWCount.model.validate(s);
    const out = MWCount.model.empty();
    // The generated strand is independent: a primary-strand 5′-DMT is not inherited.
    out.nucleotides = [...s.nucleotides].reverse().map(n => ({ chemistry: n.chemistry, base: MWCount.data.chemistries[n.chemistry].complement[n.base] }));
    out.linkages = [...s.linkages].reverse().map(l => ({ ...l }));
    return MWCount.model.validate(out);
  }
  MWCount.complement = { generate };
})();
