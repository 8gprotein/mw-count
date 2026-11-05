/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  function nucleotide(n) { return MWCount.data.chemistries[n.chemistry].prefix + n.base; }
  function serialize(s) {
    MWCount.model.validate(s);
    return s.nucleotides.map((n, i) => (i ? (s.linkages[i - 1].type === "PS" ? "-(s)-" : "-") : "") + nucleotide(n)).join("");
  }
  MWCount.serializer = { serialize, nucleotide };
})();
