# Oligonucleotide Sequence Designer & Molecular Weight Calculator
## Project Specification — Version 1

## 1. Project Goal

Build a browser-based oligonucleotide sequence designer and molecular-weight calculator.

The application should support two equivalent methods of constructing an oligonucleotide:

1. Direct text-based sequence input.
2. Graphical construction using draggable nucleotide blocks and linkage blocks.

Both representations must remain synchronized. The application should calculate the molecular formula, average molecular weight, and monoisotopic exact mass of the current oligonucleotide sequence.

Version 1 should be implemented as a **pure front-end web application** and should not require Python, a server-side backend, a database, or any external runtime.

Recommended implementation stack:

- HTML
- CSS
- JavaScript / TypeScript
- Optional lightweight front-end libraries if useful

All calculations should run locally in the browser.

Chemical-structure rendering is explicitly excluded from Version 1 and should be treated as a future feature.

---

## 2. Product Scope

Version 1 is primarily an **oligonucleotide sequence editor with molecular-property calculation**, rather than only a molecular-weight calculator.

The core application should support:

- DNA nucleotides
- RNA nucleotides
- 2'-O-methyl RNA nucleotides
- 2'-fluoro RNA nucleotides
- phosphodiester linkages (PO)
- phosphorothioate linkages (PS)
- fixed 5'-OH and 3'-OH termini
- text sequence entry
- graphical nucleotide construction
- graphical sequence editing
- bidirectional synchronization between text and graphical views
- molecular formula calculation
- average molecular weight calculation
- monoisotopic exact mass calculation
- generation of a complementary strand
- molecular-weight and exact-mass calculation for the complementary strand

The architecture should remain extensible so that future versions can support additional nucleotide chemistries, terminal modifications, conjugates, analytical calculations, and chemical-structure rendering.

---

## 3. General Design Principle

The application must use **one canonical internal sequence representation**.

The text sequence and graphical sequence are not separate sequences. They are two user-interface representations of the same underlying data model.

Conceptually:

```text
Text input
    ↓
Canonical sequence model
    ↓
Graphical sequence

Graphical editing
    ↓
Canonical sequence model
    ↓
Text representation
```

Any change to either representation must update the canonical sequence model and immediately propagate to the other representation.

This avoids synchronization errors and provides a clean foundation for future functionality.

---

## 4. Canonical Oligonucleotide Data Model

The internal representation should explicitly model:

- nucleotides
- internucleotide linkages
- 5' terminal group
- 3' terminal group

A conceptual representation could be:

```text
5'-OH
   |
Nucleotide 1
   |
Linkage 1
   |
Nucleotide 2
   |
Linkage 2
   |
Nucleotide 3
   |
3'-OH
```

A possible JavaScript-oriented conceptual structure is:

```text
Oligonucleotide {
    fivePrimeTerminus: "OH",
    nucleotides: [...],
    linkages: [...],
    threePrimeTerminus: "OH"
}
```

The number of linkages must always equal:

```text
number_of_nucleotides - 1
```

unless the sequence contains zero or one nucleotide.

---

## 5. Nucleotide Model

A nucleotide must not be represented only as A, C, G, T, or U.

Each nucleotide must separately define:

1. nucleobase
2. sugar / chemical modification class

Conceptually:

```text
Nucleotide {
    base: "A" | "C" | "G" | "T" | "U",
    chemistry: "DNA" | "RNA" | "2OMe" | "2F"
}
```

Examples:

```text
DNA-A
DNA-C
RNA-G
RNA-U
2OMe-A
2OMe-C
2F-G
2F-U
```

The exact valid base set should depend on chemistry.

Recommended default behavior:

```text
DNA:
A, C, G, T

RNA:
A, C, G, U

2'-O-methyl RNA:
A, C, G, U

2'-fluoro RNA:
A, C, G, U
```

The data model should be extensible so additional chemistry classes can later be added without redesigning the sequence architecture.

Possible future examples:

- LNA
- MOE
- cEt
- UNA
- modified nucleobases
- fluorescent labels
- conjugates

---

## 6. Linkage Model

Internucleotide linkages must be represented as independent objects.

Version 1 supports:

```text
PO = phosphodiester
PS = phosphorothioate
```

Conceptually:

```text
Linkage {
    type: "PO" | "PS"
}
```

A linkage must not exist merely as punctuation inside a text string.

This is important because linkage chemistry directly affects:

- molecular formula
- molecular weight
- exact mass
- graphical representation
- future chemical-structure generation

---

## 7. Terminal Groups

Version 1 should always display:

```text
5'-OH
```

at the left side of the sequence and:

```text
OH-3'
```

at the right side.

The user should not be allowed to change these terminal groups in Version 1.

However, terminal groups must still exist explicitly in the internal data model:

```text
fivePrimeTerminus = "OH"
threePrimeTerminus = "OH"
```

They should not be hard-coded implicitly into the mass formula.

This allows future support for modifications such as:

- 5'-phosphate
- 5'-amine
- 5'-fluorophore
- 3'-phosphate
- 3'-biotin
- inverted nucleotides
- other terminal conjugates

without redesigning the mass calculation engine.

---

## 8. Main User Interface

A desktop-oriented initial layout is preferred.

Suggested high-level arrangement:

```text
┌───────────────────────────────────────────────────────────────┐
│ Sequence Input                                                │
│ [_________________________________________________________]   │
├───────────────────┬───────────────────────────────────────────┤
│ Nucleotide        │  5'                                3'    │
│ Library           │                                           │
│                   │  OH-[A]-○-[C]-●-[G]-○-[U]-OH             │
│ Chemistry ▼       │                                           │
│ DNA               │       Graphical Sequence Workspace        │
│ RNA               │                                           │
│ 2'-OMe            │                                           │
│ 2'-F              │                                           │
│                   │                                           │
│ [A][C][G][T/U]    │                                           │
├───────────────────┴───────────────────────────────────────────┤
│ Molecular Formula: C...H...N...O...P...                       │
│ Molecular Weight: xxxx.xxxx g/mol                             │
│ Exact Mass:       xxxx.xxxx Da                                │
│                                                               │
│ [Generate Complement]                                         │
└───────────────────────────────────────────────────────────────┘
```

The exact left/right placement of the library is not essential and can be adjusted for visual quality.

The important requirement is that the nucleotide library remains visible while the graphical sequence is being constructed.

---

## 9. Text Sequence Input

The application must provide a text input area for users who already know the desired sequence.

The text format must eventually support mixed chemistry and mixed linkage types.

The sequence text parser should convert the entered string into the canonical internal sequence representation.

The canonical model should then immediately generate the corresponding graphical sequence.

Similarly, graphical changes must regenerate the text representation.

### Important implementation requirement

The parser and serializer should be implemented as separate components:

```text
sequence text
    ↓
parser
    ↓
canonical model
```

and:

```text
canonical model
    ↓
serializer
    ↓
sequence text
```

The UI must never manually manipulate both text and graphical state independently.

---

## 10. Sequence Text Syntax

The exact production syntax should be designed carefully because mixed nucleotide chemistry and mixed linkage chemistry must be unambiguous.

The implementation should use an explicit grammar rather than relying on informal string replacement.

A possible conceptual syntax might use chemistry-qualified nucleotide tokens, for example:

```text
dA dC dG dT
rA rC rG rU
mA mC mG mU
fA fC fG fU
```

where, conceptually:

```text
d = DNA
r = RNA
m = 2'-O-methyl RNA
f = 2'-fluoro RNA
```

The exact final notation may be changed during implementation or calibration.

Likewise, PO and PS linkages require an unambiguous notation.

For example, a sequence might conceptually represent:

```text
dA -PO- mC -PS- fG -PO- rU
```

The visible syntax may eventually be made more compact, but the parser must retain explicit chemistry information.

The application should be designed so that the textual notation can later be changed without altering the internal sequence model.

---

## 11. Nucleotide Library

The application should include a persistent nucleotide library.

The user selects a chemistry class through a dropdown or segmented selector:

```text
DNA
RNA
2'-OMe RNA
2'-F RNA
```

After selection, the available nucleotide blocks appear below.

Examples:

```text
DNA selected:
[A] [C] [G] [T]

RNA selected:
[A] [C] [G] [U]
```

Dragging a nucleotide from the library must **copy** the nucleotide into the sequence.

The source library element must remain available after dragging.

There should be no depletion or inventory concept.

---

## 12. Graphical Nucleotide Blocks

The graphical sequence should use compact symbolic blocks rather than full chemical structures.

Each nucleotide block should clearly communicate:

- nucleobase
- chemistry class

For example:

```text
┌─────┐
│  A  │
│ DNA │
└─────┘
```

or another compact design with equivalent information.

The UI design should visually differentiate nucleotide chemistry classes.

The exact colors, shapes, and styling can be selected during front-end implementation.

The goal is immediate readability rather than chemical-structure realism.

---

## 13. Graphical Linkages

Linkages should appear between nucleotide blocks.

The basic graphical concept is:

```text
[A] — ○ — [C] — ● — [G]
```

PO and PS linkages should use different visual styles.

A preferred approach is:

- different circle colors for PO and PS
- optional hover tooltip
- optional click-to-toggle behavior

The circle does not need to explicitly display "O" or "S".

Example tooltip:

```text
Phosphodiester (PO)
```

or:

```text
Phosphorothioate (PS)
```

Clicking a linkage should allow the user to switch:

```text
PO ↔ PS
```

A context menu or small selector may also be used if preferred.

---

## 14. Drag-and-Drop Sequence Construction

The graphical editor must allow the user to drag nucleotide blocks from the library into the sequence.

The user may add an unlimited practical number of nucleotides, subject only to reasonable browser/UI limits.

Dragging should support insertion at:

- the 5' side
- the 3' side
- any position between existing nucleotides

Example:

```text
Current:
A C G T

Possible insertion positions:
| A | C | G | T |
^   ^   ^   ^   ^
```

The UI should visually indicate the active insertion location during drag-over.

This prevents ambiguity and makes sequence construction intuitive.

---

## 15. Graphical Sequence Editing

Once a nucleotide has been inserted, the graphical editor should support:

- inserting new nucleotides
- deleting nucleotides
- moving / reordering nucleotides
- changing nucleotide chemistry
- changing nucleotide identity if desired
- changing PO/PS linkage type

Any graphical edit must immediately update:

- canonical sequence model
- text sequence
- molecular formula
- molecular weight
- exact mass
- complementary strand, if currently displayed

A deleted nucleotide should also remove or reconcile its neighboring linkage objects correctly.

Linkage behavior after insertion or deletion must be deterministic.

Recommended default:

- newly created linkage = PO
- existing unaffected linkages retain their previous type

---

## 16. 5' and 3' Directionality

The graphical sequence workspace must clearly indicate:

```text
5'
```

on the left and:

```text
3'
```

on the right.

The sequence must always be displayed in the standard direction:

```text
5' → 3'
```

The fixed terminal representation should therefore appear conceptually as:

```text
5'-OH — sequence — OH-3'
```

This directionality must remain clear during drag-and-drop editing.

---

## 17. Molecular Formula Calculation

The application should calculate molecular properties from **elemental composition**, not by merely summing stored nucleotide molecular weights.

The preferred calculation pipeline is:

```text
canonical sequence
    ↓
elemental composition
    ↓
molecular formula
    ↓
average molecular weight
    ↓
monoisotopic exact mass
```

Each supported component should have a chemically defined elemental contribution.

This includes:

- nucleotide identity
- sugar chemistry
- linkage chemistry
- terminal groups

The implementation may internally represent elemental composition as a dictionary/object:

```text
{
    C: n,
    H: n,
    N: n,
    O: n,
    P: n,
    S: n,
    F: n
}
```

The exact component formulas will initially use literature/reference values and will later be calibrated by the project owner against trusted commercial or professional software.

Therefore, chemistry constants must be isolated in a dedicated configuration/data module rather than scattered throughout calculation code.

---

## 18. Chemistry Constants

All atomic and monomer data should reside in centralized data definitions.

Suggested separation:

```text
data/
    atomicMasses
    nucleotideFragments
    linkageFragments
    terminalFragments
```

or equivalent JavaScript modules.

The rest of the application should never contain hard-coded chemistry numbers.

This allows later calibration without changing UI or algorithm code.

Examples of data that should be centralized:

- average atomic weights
- monoisotopic isotope masses
- elemental formula of each supported nucleotide fragment
- PO elemental contribution
- PS elemental contribution
- 5'-OH contribution
- 3'-OH contribution

---

## 19. Average Molecular Weight

The application should report:

```text
Molecular Weight (Average)
```

in:

```text
g/mol
```

The calculation must use standard average atomic weights.

Conceptually:

```text
MW =
Σ(element_count × average_atomic_weight)
```

The number of displayed decimal places should be configurable.

A reasonable initial UI display could use four decimal places, while preserving full internal floating-point precision.

---

## 20. Monoisotopic Exact Mass

The application should separately report:

```text
Monoisotopic Exact Mass
```

in Da.

The calculation must use the monoisotopic mass of the principal isotope for each element represented in the molecular formula.

Conceptually:

```text
Exact Mass =
Σ(element_count × monoisotopic_atomic_mass)
```

Average molecular weight and monoisotopic exact mass must never share the same atomic-mass table.

---

## 21. Molecular Formula Display

The calculated elemental formula should be displayed to the user.

Example format:

```text
C123H156N45O67P8S3F2
```

Elements with zero count should not be displayed.

A consistent conventional ordering should be used, preferably Hill-system-style ordering where practical:

```text
C, H, followed by other elements alphabetically
```

The formula is valuable both as user-facing information and as an internal debugging/calibration reference.

---

## 22. Phosphorothioate Handling

PS linkage calculation should be implemented compositionally.

Conceptually, relative to the corresponding PO linkage:

```text
replace one O with one S
```

The exact elemental accounting should be defined in the centralized linkage data.

The number of PS linkages should therefore naturally affect:

- molecular formula
- sulfur count
- oxygen count
- average molecular weight
- exact mass

The calculator should not require a separate special-case molecular-weight equation for PS sequences.

---

## 23. Complementary Strand Generation

The application should support generation of a complementary oligonucleotide.

Base-pairing behavior should follow standard Watson-Crick pairing:

```text
A ↔ T for DNA
A ↔ U for RNA-like chemistries
C ↔ G
```

The complementary sequence must be shown in the standard 5' → 3' orientation.

This requires reverse-complement logic rather than merely replacing bases in place.

---

## 24. Complement Chemistry Mapping

The complementary nucleotide should preserve the chemistry class of the source position wherever a direct equivalent exists.

Examples:

```text
DNA nucleotide
→ complementary DNA nucleotide

RNA nucleotide
→ complementary RNA nucleotide

2'-OMe nucleotide
→ complementary 2'-OMe nucleotide

2'-F nucleotide
→ complementary 2'-F nucleotide
```

Examples:

```text
DNA dA
→ DNA dT

RNA rA
→ RNA rU

2'-OMe mA
→ 2'-OMe mU

2'-F fC
→ 2'-F fG
```

Thus, mixed-chemistry sequences produce mixed-chemistry complementary strands that mirror the corresponding sugar/modification class.

If future chemistry types are added and no direct complementary chemistry is defined, the behavior must be controlled by an explicit chemistry mapping table rather than guessed dynamically.

---

## 25. Complementary Linkages

For Version 1, complementary-strand linkage chemistry should mirror the linkage pattern of the original strand in reverse orientation.

Because the complementary sequence is displayed 5' → 3', linkage order must be reversed together with nucleotide order.

Example conceptual source:

```text
5'-A-PO-C-PS-G-3'
```

When reverse-complemented, the nucleotide order is reversed, and the corresponding linkage ordering must also be reversed so that positional correspondence is preserved.

This rule should be implemented explicitly and tested.

---

## 26. Complementary Strand Properties

After generating the complementary strand, calculate and display:

- sequence
- graphical sequence
- molecular formula
- average molecular weight
- monoisotopic exact mass

The complementary strand should use the same calculation engine as the primary strand.

No separate mass-calculation implementation should exist.

---

## 27. Real-Time Calculation

Molecular properties should update immediately when the sequence changes.

Relevant events include:

- typing in the sequence field
- adding nucleotide
- deleting nucleotide
- reordering nucleotide
- changing nucleotide chemistry
- changing base
- changing PO/PS linkage

The calculations are computationally lightweight and can run entirely in the browser.

No server request should be required.

For normal oligonucleotide lengths, calculation should feel instantaneous.

---

## 28. Input Validation

The sequence parser should detect invalid input and avoid silently interpreting ambiguous syntax.

Examples of invalid states:

- unsupported nucleotide token
- invalid base for selected chemistry
- malformed linkage notation
- consecutive linkage tokens
- missing nucleotide between linkages
- impossible internal state

The UI should identify the error without destroying the previously valid sequence state where practical.

The parser should return structured errors such as:

```text
{
    position: ...,
    token: ...,
    message: ...
}
```

rather than only throwing generic exceptions.

---

## 29. Empty Sequence Behavior

For an empty sequence:

- graphical workspace should show an insertion-ready state
- molecular formula may be blank
- molecular weight should be blank or shown as `—`
- exact mass should be blank or shown as `—`
- complement button should be disabled

A zero-nucleotide sequence should not be interpreted as an OH-containing molecule.

---

## 30. Single-Nucleotide Behavior

A single nucleotide contains:

- one nucleotide
- zero internucleotide linkages
- 5'-OH
- 3'-OH

The calculation engine must correctly handle this case.

The graphical representation should not create any PO or PS linkage object for a one-nucleotide sequence.

---

## 31. Undo / Redo

Undo and redo are recommended for the graphical editor.

At minimum, sequence-changing actions should be representable as complete canonical-model snapshots or reversible operations.

Examples:

- insert nucleotide
- delete nucleotide
- reorder nucleotide
- change chemistry
- change linkage

This is not absolutely required for the earliest prototype but should be considered in the architecture.

---

## 32. Browser Persistence

Optional Version 1 convenience feature:

Store the most recent sequence locally using browser storage such as:

```text
localStorage
```

This should not require user accounts or a backend.

Possible persisted state:

- primary sequence
- linkage pattern
- current selected library chemistry
- whether complement panel is open

This feature may be omitted in the first implementation if desired.

---

## 33. Front-End Architecture

The application should be capable of deployment as a static website.

A minimal implementation could use:

```text
index.html
styles.css
app.js
```

A more maintainable implementation may split logic into modules:

```text
index.html

css/
    styles.css

js/
    app.js
    sequenceModel.js
    sequenceParser.js
    sequenceSerializer.js
    massCalculator.js
    complement.js
    dragDrop.js
    chemistryData.js
```

Either approach is acceptable.

For maintainability, modular JavaScript or TypeScript is preferred over one very large script.

---

## 34. No Python Requirement

Python is **not required** for Version 1.

All currently required functions are straightforward browser-side operations:

- parsing strings
- maintaining sequence state
- drag and drop
- DOM/SVG rendering
- elemental composition arithmetic
- molecular-weight calculation
- exact-mass calculation
- reverse-complement generation
- local state persistence

No task requires a Python runtime.

This allows the application to be hosted as a static site through services such as:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel static deployment
- local file/server environment

No server-side execution is necessary.

---

## 35. Optional Framework Choice

A framework is not mandatory.

The project can be implemented with vanilla JavaScript.

However, because the UI contains synchronized state and repeated graphical components, a component-based framework may simplify development.

Reasonable options include:

- React
- Vue
- Svelte

If an agent chooses React, a simple Vite-based application would be sufficient.

A backend framework such as:

- Flask
- Django
- FastAPI
- Express server

should **not** be introduced unless a future requirement genuinely needs server-side functionality.

---

## 36. Drag-and-Drop Implementation

Native HTML drag-and-drop can be used, but a front-end drag library may improve behavior.

Important requirements:

- drag from library creates a copy
- reorder existing nucleotide blocks
- visually indicate insertion point
- allow insertion before first nucleotide
- allow insertion after last nucleotide
- allow insertion between nucleotides
- maintain canonical state after every operation

The drag implementation must not store chemistry information only in HTML attributes. The canonical model remains the source of truth.

---

## 37. Responsive Behavior

Desktop should be the primary design target.

For smaller screens:

- nucleotide library may collapse into a drawer
- sequence workspace may horizontally scroll
- calculation panel may move below the sequence workspace

The first implementation does not need a highly optimized mobile editor, but the layout should not become unusable on narrower displays.

---

## 38. Long Sequence Handling

The graphical editor should support sequences longer than one visible row.

Possible approaches:

1. horizontal scrolling
2. wrapping nucleotide blocks across multiple rows

Wrapping is visually easier for sequence reading but makes drag-and-drop insertion more complicated.

For the first version, horizontal scrolling is acceptable and simpler.

The text input should always display the full serialized sequence independently.

---

## 39. Visual Design Goals

The application should appear more like a scientific design tool than a plain calculator.

Desired qualities:

- clean
- modern
- restrained
- chemistry-oriented
- visually readable
- compact enough for long sequences

Nucleotide classes should be visually distinguishable.

PO and PS must also be visually distinguishable.

Avoid overly decorative styling that makes sequence interpretation difficult.

---

## 40. Chemical Structure Rendering — Deferred Feature

Chemical-structure generation is explicitly excluded from Version 1.

Do not build or partially integrate a chemical-structure renderer unless separately requested.

A future version may add:

```text
Show Chemical Structure
```

and generate the complete 2D chemical representation of:

- the primary strand
- the complementary strand

A future implementation may use RDKit or another cheminformatics toolkit.

Possible future architecture:

```text
sequence
    ↓
canonical molecular graph / SMILES
    ↓
RDKit
    ↓
2D coordinates
    ↓
SVG
```

RDKit could potentially be incorporated through browser-compatible/WebAssembly approaches or other embedded execution mechanisms, avoiding the need for a permanently running backend service.

This should be evaluated separately in Version 2.

No Version 1 architecture should prevent this future extension.

---

## 41. Future Features — Not Part of Version 1

Potential future features include:

- chemical structure rendering
- RDKit integration
- 5' terminal modifications
- 3' terminal modifications
- fluorescent labels
- biotin
- GalNAc
- PEG/linker groups
- LNA
- MOE
- cEt
- custom monomers
- custom nucleotide database
- extinction coefficient
- concentration conversion
- UV-based quantitation
- melting temperature
- GC content
- charge-state prediction
- MS isotopic envelope
- sodium/ammonium salt forms
- ion/adduct mass calculation
- automated LC-MS expected mass table
- export as image
- export sequence
- import sequence
- saved projects
- user-defined chemistry

These features must not complicate the initial implementation unnecessarily.

---

## 42. Recommended Internal Module Responsibilities

### `chemistryData`

Stores all chemically calibrated constants.

Responsibilities:

- supported chemistry types
- supported bases
- elemental formulas
- linkage elemental composition
- terminal-group composition
- average atomic weights
- monoisotopic atomic masses
- complement chemistry mapping

---

### `sequenceModel`

Owns the canonical oligonucleotide representation.

Responsibilities:

- insert nucleotide
- remove nucleotide
- reorder nucleotide
- modify nucleotide
- modify linkage
- validate nucleotide/linkage count
- clone sequence
- serialize state

---

### `sequenceParser`

Converts user-entered sequence syntax into the canonical model.

Responsibilities:

- lexical parsing
- token validation
- chemistry recognition
- linkage recognition
- error reporting

---

### `sequenceSerializer`

Converts canonical sequence state into user-visible sequence notation.

---

### `massCalculator`

Responsibilities:

```text
sequence
→ elemental formula
→ average molecular weight
→ monoisotopic exact mass
```

This module must contain calculation logic but should obtain constants from `chemistryData`.

---

### `complement`

Responsibilities:

- reverse nucleotide order
- complementary base mapping
- preserve/mirror chemistry class
- reverse linkage order
- produce a new valid canonical sequence

---

### `graphicalEditor`

Responsibilities:

- render nucleotide blocks
- render PO/PS connectors
- drag from library
- insert
- delete
- reorder
- modify nucleotide
- modify linkage
- show 5'/3' labels

---

### `appState`

If a front-end framework is used, centralize application state.

The canonical sequence should remain the single source of truth.

---

## 43. Calculation Validation Strategy

The project owner intends to calibrate the calculator against professional/reference software.

The application should therefore make validation easy.

Recommended development-time test cases:

```text
single nucleotide
short DNA
short RNA
2'-OMe sequence
2'-F sequence
mixed chemistry sequence
all-PO sequence
all-PS sequence
mixed PO/PS sequence
```

For each test case record:

- text sequence
- elemental formula
- molecular weight
- exact mass
- expected/reference result
- difference

Chemistry constants should be adjusted only in `chemistryData`.

Do not add ad hoc correction factors inside the calculation algorithm to make individual test cases match.

---

## 44. Unit Testing

Core chemistry functions should be independent from the DOM so they can be unit-tested.

At minimum test:

- parser
- serializer
- sequence insertion/deletion
- linkage count maintenance
- complement generation
- reverse linkage mapping
- elemental formula summation
- average MW calculation
- exact mass calculation
- PO-to-PS elemental difference

UI tests are secondary to chemistry/model correctness.

---

## 45. Error Prevention Principles

The implementation should enforce several invariants:

```text
linkage count = nucleotide count - 1

all nucleotide types are valid

all linkage types are valid

terminal state always exists

sequence is always interpreted 5' → 3'
```

Do not allow malformed UI state to exist temporarily and later attempt to infer what the user intended.

---

## 46. Suggested Development Sequence

### Phase 1 — Data Model

Implement:

- chemistry definitions
- nucleotide type
- linkage type
- canonical sequence model

No UI complexity yet.

---

### Phase 2 — Calculation Engine

Implement:

- elemental composition
- molecular formula
- average MW
- monoisotopic exact mass

Validate against several known sequences.

---

### Phase 3 — Text Parser and Serializer

Implement:

```text
text ↔ canonical model
```

Confirm perfect round-trip behavior for supported syntax.

---

### Phase 4 — Basic Web UI

Implement:

- sequence text box
- formula display
- MW display
- exact mass display

---

### Phase 5 — Graphical Sequence View

Implement graphical nucleotide blocks and PO/PS connectors.

At this stage the graphics may be read-only.

---

### Phase 6 — Graphical Editing

Add:

- nucleotide library
- drag-and-drop insertion
- deletion
- reordering
- linkage switching
- chemistry modification

Ensure immediate text synchronization.

---

### Phase 7 — Complementary Strand

Implement:

- reverse complement
- chemistry mirroring
- linkage reversal
- complementary molecular properties

---

### Phase 8 — Visual Refinement

Improve:

- colors
- block styles
- insertion indicators
- tooltips
- responsive behavior
- long-sequence scrolling
- error presentation

---

### Phase 9 — Calibration

Compare calculation results against trusted professional software and reference datasets.

Adjust chemistry constants only.

---

## 47. Version 1 Acceptance Criteria

Version 1 is considered complete when all of the following are true:

1. User can type a supported oligonucleotide sequence.
2. Text is parsed into a canonical sequence representation.
3. Graphical representation appears automatically.
4. User can construct a sequence by dragging nucleotides from the library.
5. User can insert nucleotides at arbitrary sequence positions.
6. User can delete and reorder nucleotides.
7. User can distinguish DNA, RNA, 2'-OMe, and 2'-F nucleotide blocks.
8. User can distinguish PO and PS linkages.
9. User can change PO ↔ PS.
10. Graphical edits update the text sequence.
11. Text edits update the graphical sequence.
12. 5'-OH and 3'-OH are explicitly displayed.
13. Molecular formula is calculated.
14. Average molecular weight is calculated.
15. Monoisotopic exact mass is calculated.
16. All calculations occur in-browser.
17. User can generate the complementary strand.
18. Complementary chemistry mirrors the corresponding source chemistry.
19. Complement linkage pattern is reversed consistently with the sequence.
20. Complement molecular formula, MW, and exact mass are calculated.
21. No Python runtime is required.
22. No backend server is required.
23. Chemical structure rendering is not included.
24. Chemistry constants are centralized and easy to recalibrate.
25. The architecture remains suitable for future chemical-structure rendering.

---

## 48. Key Architectural Principle

The most important rule for any implementation agent is:

> The canonical chemical sequence model is the single source of truth.

Do not build the application as a text calculator with a graphical layer attached afterward.

The desired architecture is:

```text
                 ┌───────────────┐
Text editor  ↔   │               │   ↔ Graphical editor
                 │ Canonical     │
                 │ Sequence      │
                 │ Model         │
                 └───────┬───────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
          Formula       Mass    Complement
              │          │          │
              └──────────┴──────────┘
```

This architecture should be preserved throughout development.

---

## 49. Version 1 Technology Recommendation

Preferred simplest deployment:

```text
Static front-end application
```

Recommended choices:

### Option A — Minimal dependency

```text
HTML
CSS
Vanilla JavaScript ES modules
```

Advantages:

- no build system required
- no Python
- no backend
- simple deployment
- easy to inspect and modify

### Option B — Recommended for richer interaction

```text
Vite
React or Vue
TypeScript
CSS
```

Advantages:

- cleaner component state
- easier drag-and-drop UI
- easier synchronized rendering
- easier expansion in future versions

Even with Option B, the final result is still a static web application.

The build step is only a development tool. The deployed application consists of static HTML/CSS/JavaScript assets and does not require Node.js on the server.

---

## 50. Final Scope Boundary

For Version 1, prioritize:

```text
correct sequence model
correct chemistry model
correct molecular calculations
good graphical editing
reliable synchronization
```

Do not spend development effort on:

```text
chemical structure drawing
backend infrastructure
user accounts
cloud storage
databases
advanced analytical calculations
```

These can be added after the core oligonucleotide editor has been validated.

