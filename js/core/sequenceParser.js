/* designed/corrected by YZ, implemented by openAI */
"use strict";
(() => {
  const tokenRegex = new RegExp("^(" + MWCount.data.tokenPattern + ")", "u");
  function parse(text) {
    const s = MWCount.model.empty(); let pos = 0;
    const skip = () => { while (pos < text.length && /\s/u.test(text[pos])) pos++; };
    const fail = message => ({ ok: false, error: { position: pos, token: text.slice(pos, pos + 10), message } });
    skip(); if (pos === text.length) return { ok: true, sequence: s };
    while (pos < text.length) {
      const match = tokenRegex.exec(text.slice(pos));
      if (!match) return fail("Expected a prefixed nucleotide, e.g. dA, rU, mC or fG (lowercase prefix, uppercase base).");
      const { chemistry, base } = MWCount.data.tokenDefinitions[match[0]];
      if (!MWCount.data.chemistries[chemistry].bases.includes(base)) return fail(`Invalid ${match[0]}: ${MWCount.data.chemistries[chemistry].label} does not support ${base}.`);
      s.nucleotides.push({ chemistry, base }); pos += match[0].length;
      if (s.nucleotides.length > MWCount.data.maxNucleotides) return fail(`Maximum length: ${MWCount.data.maxNucleotides} nucleotides.`);
      skip(); if (pos === text.length) break;
      if (text[pos] !== "-") return fail("Expected - (PO) or -(s)- (PS) between nucleotides.");
      pos++; skip(); let type = "PO";
      if (text[pos] === "(") {
        const link = /^\(\s*[sS]\s*\)\s*-/u.exec(text.slice(pos));
        if (!link) return fail("Write PS linkages as -(s)-.");
        pos += link[0].length; type = "PS"; skip();
      }
      s.linkages.push({ type });
      if (pos === text.length) return fail("Expected a nucleotide after the linkage.");
    }
    try { return { ok: true, sequence: MWCount.model.validate(s) }; }
    catch (e) { return fail(e.message); }
  }
  MWCount.parser = { parse };
})();
