/* designed/corrected by YZ, implemented by openAI */
const test = require('node:test');
const assert = require('node:assert/strict');
for (const file of ['data/chemistryData', 'core/sequenceModel', 'core/sequenceParser', 'core/sequenceSerializer', 'core/massCalculator', 'core/complement', 'core/sequenceBuilder', 'ui/appState']) require(`../js/${file}.js`);
const { parser, serializer, model, mass, complement, data, state } = globalThis.MWCount;
const parse = text => { const p = parser.parse(text); assert.equal(p.ok, true, JSON.stringify(p.error)); return p.sequence; };
const serialize = serializer.serialize;
const dG = { chemistry: 'DNA', base: 'G' };
const near = (value, expected, tolerance = 1e-7) => assert.ok(Math.abs(value - expected) < tolerance, `${value} != ${expected}`);

test('empty is no molecule; single dA has two OH, no phosphate', () => {
  assert.equal(mass.calculate(parse(' \n ')), null);
  const single = parse('dA'); assert.equal(single.linkages.length, 0);
  const p = mass.calculate(single);
  assert.equal(p.formula, 'C10H13N5O3'); // PubChem CID 13730
  near(p.average, 251.246);
  near(p.monoisotopic, 251.1018393);
});

test('all 16 complete monomer formulas and 2-prime substitutions', () => {
  const expected = {
    dA:'C10H13N5O3',dC:'C9H13N3O4',dG:'C10H13N5O4',dT:'C10H14N2O5',
    rA:'C10H13N5O4',rC:'C9H13N3O5',rG:'C10H13N5O5',rU:'C9H12N2O6',
    mA:'C11H15N5O4',mC:'C10H15N3O5',mG:'C11H15N5O5',mU:'C10H14N2O6',
    fA:'C10H12FN5O3',fC:'C9H12FN3O4',fG:'C10H12FN5O4',fU:'C9H11FN2O5'
  };
  for (const [input, formula] of Object.entries(expected)) assert.equal(mass.calculate(parse(input)).formula, formula, input);
});

test('short chain fixtures use phosphodiester condensation, without duplicated terminal OH', () => {
  assert.equal(mass.calculate(parse('dA-dC')).formula, 'C19H25N8O9P');
  near(mass.calculate(parse('dA-dC')).average, 540.429761998);
  assert.equal(mass.calculate(parse('dA-dC-dG-dT')).formula, 'C39H50N15O22P3');
  assert.equal(mass.calculate(parse('rA-rC-rG-rU')).formula, 'C38H48N15O26P3');
  assert.equal(mass.calculate(parse('mA-mC-mG-mU')).formula, 'C42H56N15O26P3');
  assert.equal(mass.calculate(parse('fA-fC-fG-fU')).formula, 'C38H44F4N15O22P3');
  // O: dA(3)+dC(4)+mG(5)+fU(5)+3 bridges*2-1 PS replacement = 22.
  assert.equal(mass.calculate(parse('dA-dC-(s)-mG-fU')).formula, 'C39H49FN15O22P3S');
});

test('each PS replaces exactly O with S, in formula and both mass tables', () => {
  const po = mass.calculate(parse('dA-dC-dG-dT'));
  for (const [input, count] of [['dA-(s)-dC-dG-dT',1],['dA-(s)-dC-(s)-dG-(s)-dT',3]]) {
    const ps = mass.calculate(parse(input));
    assert.equal(ps.composition.O, po.composition.O-count); assert.equal(ps.composition.S,count);
    for (const e of ['C','H','N','P']) assert.equal(ps.composition[e],po.composition[e]);
    near(ps.average-po.average,count*16.061);
    near(ps.monoisotopic-po.monoisotopic,count*15.97715655483);
  }
});

test('explicit grammar, whitespace and stable round trip', () => {
  const s = parse('  dA - mC - ( S ) - fG -\n rU  ');
  assert.equal(serialize(s),'dA-mC-(s)-fG-rU');
  assert.deepEqual(parse(serialize(s)),s);
  for (const key of Object.keys(data.nucleotideFragments)) assert.equal(serialize(parse(key)),key);
});

test('invalid and incomplete input returns positioned errors without throwing', () => {
  for (const input of ['ACGT','dU','rT','mT','fT','dA-','dA-(s)-','dA--dC','dA-PS-dC','dA-(O)-dC','dA dC','dA<script>','da','DA','dA-(x)-dC']) {
    const out=parser.parse(input); assert.equal(out.ok,false,input); assert.equal(typeof out.error.position,'number'); assert.ok(out.error.message);
  }
});

test('all four insertion boundaries preserve the selected PS side', () => {
  const s=parse('dA-(s)-dC');
  const expected=['dG-dA-(s)-dC','dA-dG-(s)-dC','dA-(s)-dG-dC','dA-(s)-dC-dG'];
  expected.forEach((text,slot)=>assert.equal(serialize(model.insert(s,dG,slot)),text));
  assert.equal(serialize(s),'dA-(s)-dC');
  assert.equal(serialize(model.insert(model.empty(),dG,0)),'dG');
});

test('deletion removes both adjacent links, reconciles with PO, preserves distant links', () => {
  const s=parse('dA-(s)-dC-(s)-dG-(s)-dT');
  assert.equal(serialize(model.remove(s,1)),'dA-dG-(s)-dT');
  assert.equal(serialize(model.remove(s,0)),'dC-(s)-dG-(s)-dT');
  assert.equal(serialize(model.remove(s,3)),'dA-(s)-dC-(s)-dG');
  assert.deepEqual(model.remove(parse('dA'),0),model.empty());
});

test('moves are delete-and-insert, including end slots and PS sides', () => {
  const s=parse('dA-(s)-dC-(s)-dG-dT');
  assert.equal(serialize(model.move(s,3,1)),'dA-dT-(s)-dC-(s)-dG');
  assert.equal(serialize(model.move(s,3,2)),'dA-(s)-dT-dC-(s)-dG');
  assert.equal(serialize(model.move(s,0,7)),'dC-(s)-dG-dT-dA');
  assert.equal(serialize(model.move(s,3,0)),'dT-dA-(s)-dC-(s)-dG');
  assert.deepEqual(model.move(s,1,2),s); assert.deepEqual(model.move(s,1,3),s);
});

test('every source/target pair preserves nucleotide multiset and invariants', () => {
  const s=parse('dA-(s)-mC-fG-(s)-rU-dT');
  const multiset=x=>x.nucleotides.map(serializer.nucleotide).sort();
  for(let i=0;i<s.nucleotides.length;i++) for(let slot=0;slot<=2*s.nucleotides.length-1;slot++) {
    const out=model.move(s,i,slot); model.validate(out); assert.deepEqual(multiset(out),multiset(s));
    assert.deepEqual(parse(serialize(out)),out);
  }
});

test('reverse complement mirrors chemistries and reverses asymmetric link pattern', () => {
  const s=parse('dA-(s)-mC-fG-rU'); const c=complement.generate(s);
  assert.equal(serialize(c),'rA-fC-mG-(s)-dT');
  assert.deepEqual(complement.generate(c),s);
  assert.deepEqual(complement.generate(model.empty()),model.empty());
  assert.equal(serialize(s),'dA-(s)-mC-fG-rU');
  assert.ok(mass.calculate(c).monoisotopic>0);
});

test('model rejects invalid links, base chemistry, endpoints, index, length', () => {
  assert.throws(()=>model.validate({...model.empty(),fivePrimeTerminus:'P'}));
  assert.throws(()=>model.setLink(parse('dA-dC'),0,'BAD'));
  assert.throws(()=>model.update(parse('dA'),0,{chemistry:'DNA',base:'U'}));
  assert.throws(()=>model.remove(parse('dA'),-1));
  assert.throws(()=>model.insert(parse('dA'),dG,4));
  assert.throws(()=>model.validate({...parse('dA'),linkages:[{type:'PO'}]}));
  assert.equal(parser.parse(Array(data.maxNucleotides+1).fill('dA').join('-')).ok,false);
});

test('invalid draft clears canonical model and derived values; undo/redo restores consistent snapshots', () => {
  const s=state.create(); s.text('dA-(s)-dC'); s.toggleComplement();
  s.text('dA-'); assert.ok(s.get().error); assert.equal(s.get().draft,'dA-'); assert.deepEqual(s.get().sequence,model.empty());
  assert.equal(mass.calculate(s.get().sequence),null);
  s.edit(x=>model.insert(x,dG,0)); assert.equal(s.get().draft,'dA-');
  s.undo(); assert.equal(s.get().error,null); assert.equal(s.get().draft,'dA-(s)-dC');
  s.redo(); assert.ok(s.get().error);
  s.text(''); assert.equal(s.get().error,null);
  s.edit(x=>model.insert(x,dG,0)); assert.equal(s.get().draft,'dG');
  s.undo(); assert.equal(s.get().draft,'');
});

test('deterministic mixed sequence stress: round-trip, complement involution, nonnegative formula', () => {
  let seed=531; const rnd=n=>{seed=(seed*1664525+1013904223)>>>0;return seed%n;};
  const keys=Object.keys(data.nucleotideFragments); let s=model.empty();
  for(let i=0;i<150;i++) {
    const n=parse(keys[rnd(keys.length)]).nucleotides[0];
    s=model.insert(s,n,rnd(Math.max(1,2*s.nucleotides.length)));
    if(s.linkages.length) s=model.setLink(s,rnd(s.linkages.length),rnd(2)?'PO':'PS');
    if(i%4===0&&s.nucleotides.length>1) s=model.remove(s,rnd(s.nucleotides.length));
    assert.deepEqual(parse(serialize(s)),s); assert.deepEqual(complement.generate(complement.generate(s)),s);
    assert.ok(Object.values(mass.calculate(s).composition).every(x=>Number.isSafeInteger(x)&&x>=0));
  }
});
