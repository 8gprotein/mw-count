/* Edit mass inputs here. This is a JavaScript data file so Chrome can load it from file://. */
"use strict";
globalThis.MWCount = globalThis.MWCount || {};
MWCount.massData = {
  // Average atomic weights (g/mol) and neutral monoisotopic masses (Da).
  atomicMasses: {
    C: { average: 12.011, mono: 12 },
    H: { average: 1.008, mono: 1.00782503223 },
    N: { average: 14.007, mono: 14.00307400443 },
    O: { average: 15.999, mono: 15.99491461957 },
    P: { average: 30.973761998, mono: 30.97376199842 },
    S: { average: 32.06, mono: 31.9720711744 },
    F: { average: 18.998403163, mono: 18.99840316273 }
  },
  // Complete neutral nucleoside elemental compositions. Masses are calculated
  // from these formulas and the atomic weights above, rather than hard-coded.
  nucleosides: {
    dA: { C:10,H:13,N:5,O:3 }, dC: { C:9,H:13,N:3,O:4 },
    dG: { C:10,H:13,N:5,O:4 }, dT: { C:10,H:14,N:2,O:5 },
    rA: { C:10,H:13,N:5,O:4 }, rC: { C:9,H:13,N:3,O:5 },
    rG: { C:10,H:13,N:5,O:5 }, rU: { C:9,H:12,N:2,O:6 }
  },
  // Apply these elemental changes to the matching RNA nucleoside.
  chemistryDeltas: {
    "2OMe": { C:1,H:2 },
    "2F": { H:-1,O:-1,F:1 }
  },
  // Bridges include both ester oxygens. Terminal groups are added once.
  linkageFragments: {
    PO: { H:1,P:1,O:4 },
    PS: { H:1,P:1,O:3,S:1 }
  },
  // DMT replaces the 5′ hydroxyl hydrogen: net +C21H18O2 vs. OH.
  terminalFragments: {
    fivePrime: { OH:{O:1,H:1}, DMT:{C:21,H:19,O:3} },
    threePrime: { OH:{O:1,H:1} }
  }
};
