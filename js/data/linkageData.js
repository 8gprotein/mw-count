/* designed/corrected by YZ, implemented by openAI */
"use strict";
globalThis.MWCount = globalThis.MWCount || {};
// Compatibility alias; edit elemental values only in massData.js.
if (typeof module !== "undefined" && module.exports) require("./massData.js");
MWCount.linkageData = {
  linkageFragments: MWCount.massData.linkageFragments,
  terminalFragments: MWCount.massData.terminalFragments
};
