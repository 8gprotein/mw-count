/* designed/corrected by YZ, implemented by openAI */
const test=require('node:test'),assert=require('node:assert/strict');
for(const f of ['data/chemistryData','core/sequenceModel','core/sequenceParser','core/sequenceSerializer','core/sequenceBuilder','core/massCalculator','core/complement','ui/appState'])require('../js/'+f+'.js');
const {model:M,parser:P,builder:B,mass,complement,state:S}=MWCount;
const parse=text=>P.parse(text).sequence;
test('DMT substitutes the 5-prime H; neutral elemental delta C21H18O2',()=>{
 for(const text of ['dA','dA-(s)-mC-fG-rU']){
  const base=parse(text),protectedStrand={...base,fivePrimeTerminus:'DMT'};
  const h=mass.calculate(base),dmt=mass.calculate(protectedStrand);
  for(const e of ['C','H','O','N','P','S','F'])assert.equal((dmt.composition[e]||0)-(h.composition[e]||0),({C:21,H:18,O:2}[e]||0));
  assert.ok(Math.abs(dmt.average-h.average-302.373)<1e-8);
  assert.ok(Math.abs(dmt.monoisotopic-h.monoisotopic-302.13067981928)<1e-8);
 }
 assert.equal(mass.calculate({...parse('dA'),fivePrimeTerminus:'DMT'}).formula,'C31H31N5O5');
 assert.equal(mass.calculate({...M.empty(),fivePrimeTerminus:'DMT'}),null);
});
test('valid sequence edits preserve the selected protecting group',()=>{
 const s={...parse('dA-(s)-dC-dG'),fivePrimeTerminus:'DMT'};
 for(const next of [M.insert(s,{chemistry:'DNA',base:'T'},1),M.remove(s,1),M.move(s,0,5),M.update(s,0,{chemistry:'RNA',base:'A'}),M.setLink(s,0,'PO')])assert.equal(next.fivePrimeTerminus,'DMT');
 assert.throws(()=>M.validate({...s,fivePrimeTerminus:'BAD'}));
});
test('workspace terminal setting survives typing, incomplete drafts and undo/redo',()=>{
 const s=S.create();s.text('dA');s.setFivePrime('DMT');assert.equal(s.get().sequence.fivePrimeTerminus,'DMT');
 s.text('dA-dC');assert.equal(s.get().sequence.fivePrimeTerminus,'DMT');
 s.build(ts=>B.insert(ts,{kind:'link',type:'PS'},ts.length));assert.ok(s.get().error);assert.equal(s.get().fivePrimeTerminus,'DMT');assert.equal(mass.calculate(s.get().sequence),null);
 s.build(ts=>B.insert(ts,{kind:'nucleotide',chemistry:'DNA',base:'T'},ts.length));assert.equal(s.get().sequence.fivePrimeTerminus,'DMT');
 s.setFivePrime('OH');assert.equal(s.get().sequence.fivePrimeTerminus,'OH');s.undo();assert.equal(s.get().sequence.fivePrimeTerminus,'DMT');s.redo();assert.equal(s.get().sequence.fivePrimeTerminus,'OH');
 s.setFivePrime('DMT');s.text('');assert.equal(s.get().fivePrimeTerminus,'OH');s.undo();assert.equal(s.get().sequence.fivePrimeTerminus,'DMT');
});
test('protecting group belongs to the primary strand; generated complement has free OH',()=>{
 const s={...parse('dA-dC'),fivePrimeTerminus:'DMT'};const c=complement.generate(s);
 assert.equal(c.fivePrimeTerminus,'OH');assert.equal(c.threePrimeTerminus,'OH');assert.equal(s.fivePrimeTerminus,'DMT');
});
