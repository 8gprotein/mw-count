<!-- designed/corrected by YZ, implemented by openAI -->
# Oligonucleotide Mass Calculation — V1

An offline oligonucleotide sequence editor and neutral mass calculator. Open `index.html` in a current browser to use it; no installation or account is required.

## Run on another computer

Copy the entire project folder, preserving the relative positions of `index.html`, `css/`, and `js/`. Open `index.html` in a current Chrome browser. The editor and calculations work offline. No installation, Node.js, Python, local server, database, build step, or internet connection is required. The references in the calculation notes link to external sites, but they are optional reading and are never used for calculations.

To edit the molecular weight inputs, open `js/data/massData.js` in a text editor. Save the file and reload the page. Copy the edited file along with the rest of the folder when moving to another computer. This file uses a JavaScript object with JSON-style key/value data rather than strict `.json`: Chrome does not automatically allow a `file://` page to fetch a separate JSON file. Keeping the data in a classic script preserves direct, offline opening. No code build is needed after an edit.

The inputs include average and monoisotopic atomic masses, the elemental formulas of the eight unmodified DNA/RNA nucleosides, the elemental changes for 2′-OMe and 2′-F, PO/PS bridges, and terminal groups. The application computes each nucleotide's mass from its elemental formula and the atomic mass table; there is no separate list of hard-coded nucleotide masses. For example, correcting the dA formula means editing `nucleosides.dA`, and correcting carbon's average mass means editing `atomicMasses.C.average`. Keep element counts as whole numbers. An invalid or missing input causes startup validation to fail.

## Use

- Enter prefixed nucleotides such as `dA-dC-(s)-mG-fU`. `-` means PO and `-(s)-` means PS. Prefixes are lowercase; bases are uppercase. Bare `ACGT` is not inferred.
- Drag nucleotides from the library into the workspace. Click a nucleotide to change its chemistry or base, move it, or delete it. Drag a nucleotide already in the strand to reorder it.
- Drag PO or PS onto a linkage to replace it, or click a linkage to switch its type. Linkages can also be placed at a terminus or insertion position to create an editable incomplete draft. Invalid drafts retain their drawing but have no calculated mass until completed.
- A nucleotide inserted left of a PS linkage gets a new PO on its left: `dA-(s)-dC` becomes `dA-dG-(s)-dC`. Inserting right yields `dA-(s)-dG-dC`.
- Deleting a nucleotide removes both adjacent linkages and reconnects new neighbors with PO. Other linkages stay in place.
- Select H or DMT at the primary strand's 5′ terminus. The 3′ terminus is OH. The reverse complement retains corresponding sugar chemistries and reversed linkage order; it has independent OH termini.
- Use Undo and Redo for up to 100 states. Clearing the workspace clears the text, drawing, properties, and complement; Undo can restore the strand. Reloading the page clears the current strand.
- Up to 2,000 nucleotides are supported. The drawing wraps after 20 nucleotides per row and scrolls vertically inside the workspace. The complement is shown antiparallel, 3′ to 5′ from left to right.
- Select 2, 4, or 6 display decimals. The molecular formula is available internally for validation but is not shown in the interface.

## Project files

| File | Purpose |
|---|---|
| `index.html` | Page structure and classic script loading order |
| `css/styles.css`, `css/editor.css` | Layout, editor, and responsive styling |
| `js/data/massData.js` | Editable elemental formulas and atomic mass inputs |
| `js/data/chemistryCatalog.js` | Chemistry names, token prefixes, bases, colors, and complements |
| `js/data/linkageData.js` | Compatibility alias for linkage and terminus inputs |
| `js/data/chemistryData.js` | Input validation, derived nucleotide formulas, and token definitions |
| `js/core/` | Sequence model, parser, serializer, builder, complement, and mass calculator |
| `js/ui/`, `js/app.js` | Editor, drag and drop, state, layout, rendering, and events |
| `tests/`, `tools/` | Developer tests and optional local preview utilities; not needed to use the app |

The browser loads classic scripts in order through the `MWCount` namespace. It uses no ES module imports or runtime network requests, so direct `file://` opening works. To add a new sugar chemistry, define its name, token prefix, bases, and complements in `chemistryCatalog.js`, then add its complete nucleoside formulas or an elemental delta in `massData.js`. The catalog still accepts `monomers` and `delta` for custom extensions, but the built-in mass inputs live in `massData.js`.

## Calculation conventions

Calculations describe neutral, anhydrous molecules. Counterions, hydrates, salts, and mass spectrometry adducts are excluded. Linkages use their neutral acid forms; solution pH and deprotonation are not modeled. Monoisotopic mass describes a neutral molecule, not m/z.

Nonempty strands have 5′-OH and 3′-OH by default. The 5′ H/DMT selector replaces the hydroxyl hydrogen with DMT when selected. A single nucleoside has no linkage or phosphorus. An empty strand is not a molecule.

For elemental bookkeeping, subtract two terminal OH groups from each complete nucleoside to obtain its internal fragment. Each PO bridge contributes HPO4 and each PS bridge HPO3S, including the two ester oxygens. Add one terminal group at each end. Equivalently:

```text
strand formula = sum of complete nucleoside formulas + each PO (P + 2O - H)
each PS replaces one O with one S relative to PO
```

2′-OMe adds CH2 relative to RNA. 2′-F removes OH and adds F relative to RNA. Formulas use Hill order: C, H, then the remaining elements alphabetically. Average masses use fixed conventional atomic weights; monoisotopic masses use a separate isotope mass table. Other software may use a different average-weight convention, so align conventions before comparing results. Full modified-strand calibration against professional software is still pending; no sequence-specific correction constants are used.

The DMT terminal fragment is C21H19O3 instead of OH, a net addition of C21H18O2. With this project's masses, it adds 302.373 g/mol average and 302.13067981928 Da monoisotopic. [DMT-Cl has formula C21H19ClO2](https://www.sigmaaldrich.com/TD/en/product/aldrich/100013); attaching DMT to ROH releases HCl.

Data references: [NIST element and isotope compositions](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl); PubChem [dA](https://pubchem.ncbi.nlm.nih.gov/compound/Deoxyadenosine), [dC](https://pubchem.ncbi.nlm.nih.gov/compound/Deoxycytidine), [dG](https://pubchem.ncbi.nlm.nih.gov/compound/Deoxyguanosine), [dT](https://pubchem.ncbi.nlm.nih.gov/compound/Thymidine), [rA](https://pubchem.ncbi.nlm.nih.gov/compound/Adenosine), [rC](https://pubchem.ncbi.nlm.nih.gov/compound/Cytidine), [rG](https://pubchem.ncbi.nlm.nih.gov/compound/Guanosine), and [rU](https://pubchem.ncbi.nlm.nih.gov/compound/Uridine).

## Optional development checks

Node.js is needed only for these optional commands. No `npm install` is required.

```powershell
npm test
npm run preview
```

The preview tool serves static files on localhost; it does not calculate molecular properties. The tests cover formulas, masses, editing, parsing, complements, drafts, layout, terminal groups, and catalog extension. GitHub Actions runs the same tests on pushes and pull requests. `tools/token-usage.cjs` is an optional developer utility; its generated reports are excluded from the repository.
