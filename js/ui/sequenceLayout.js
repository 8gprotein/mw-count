/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  // Fixed 20-nucleotide rows; one shared display scale fits the measured canvas.
  const geometry = Object.freeze({ nucleotide: 44, linkage: 24, bond: 6, rowEnds: 132, maxPerRow: 20 });
  function capacity() { return geometry.maxPerRow; }
  function scale(availableWidth, naturalWidth) {
    return naturalWidth > 0 ? Math.max(0,Math.min(1,availableWidth/naturalWidth)) : 1;
  }
  function rows(tokens, limit = 20) {
    limit = Math.max(1, Math.min(20, Math.floor(limit)));
    const lastNucleotide = tokens.findLastIndex(t => t.kind === "nucleotide");
    const out = []; let start = 0, count = 0, ordinal = 0, first = 1;
    tokens.forEach((t, i) => {
      // The boundary linkage belongs to the NEXT row, including both of its drop sides.
      if (count >= limit && i <= lastNucleotide) {
        out.push({ start, end: i, first, last: ordinal }); start = i; count = 0; first = ordinal + 1;
      }
      if (t.kind === "nucleotide") { count++; ordinal++; }
    });
    if (tokens.length) out.push({ start, end: tokens.length, first, last: ordinal });
    return out;
  }
  const displayTokens=(tokens,reverse=false)=>reverse?[...tokens].reverse():[...tokens];
  MWCount.layout = { geometry, capacity, scale, rows, displayTokens };
})();
