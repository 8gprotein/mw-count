/* designed/corrected by YZ, implemented by openAI */
const test=require('node:test'),assert=require('node:assert/strict');
for(const f of ['data/chemistryData','core/sequenceModel','core/sequenceParser','core/sequenceSerializer','core/massCalculator','core/complement','core/sequenceBuilder','ui/appState'])require('../js/'+f+'.js');
const {builder:B,model:M,parser:P,state:S,mass}=MWCount;
const ts=text=>M.tokens(P.parse(text).sequence);
const C={kind:'nucleotide',chemistry:'DNA',base:'C'};
test('terminal PS remains a draft until a nucleotide completes the open 3-prime end',()=>{
 const s=S.create();s.text('dA');s.toggleComplement();
 s.build(t=>B.insert(t,{kind:'link',type:'PS'},t.length));
 assert.equal(s.get().draft,'dA-(s)-');assert.equal(s.get().drawing.length,2);assert.ok(s.get().error);assert.equal(mass.calculate(s.get().sequence),null);assert.equal(s.get().complementOpen,true);
 assert.deepEqual(B.analyze(s.get().drawing).invalidIndexes,[1]);
 s.build(t=>B.insert(t,C,t.length));assert.equal(s.get().draft,'dA-(s)-dC');assert.equal(s.get().error,null);assert.ok(mass.calculate(s.get().sequence));
 s.undo();assert.ok(s.get().error);assert.equal(s.get().drawing.length,2);
 s.redo();assert.equal(s.get().error,null);
});
test('open 5-prime end and adjacent linkages can both be repaired',()=>{
 let t=B.insert(ts('dA'),{kind:'link',type:'PS'},0);assert.equal(B.analyze(t).valid,false);
 t=B.insert(t,C,0);assert.equal(B.serialize(t),'dC-(s)-dA');assert.equal(B.analyze(t).valid,true);
 t=B.insert(t,{kind:'link',type:'PO'},2);assert.equal(B.analyze(t).valid,false);
 t=B.insert(t,C,2);assert.equal(B.analyze(t).valid,true);assert.equal(B.serialize(t),'dC-(s)-dC-dA');
});
test('removing pending PS restores the original molecule and text',()=>{
 const t=B.insert(ts('dA'),{kind:'link',type:'PS'},1);
 const repaired=B.removeLink(t,1);assert.equal(B.serialize(repaired),'dA');assert.equal(B.analyze(repaired).valid,true);
});
test('builder preserves established insert/delete/move rules on valid drawings',()=>{
 const s=P.parse('dA-(s)-dC-(s)-dG-dT').sequence,t=M.tokens(s);
 for(let slot=0;slot<=t.length;slot++)assert.deepEqual(B.analyze(B.insert(t,C,slot)).sequence,M.insert(s,{chemistry:'DNA',base:'C'},slot));
 for(let i=0;i<s.nucleotides.length;i++){
  assert.deepEqual(B.analyze(B.remove(t,i)).sequence,M.remove(s,i));
  for(let slot=0;slot<=t.length;slot++)assert.deepEqual(B.analyze(B.move(t,i,slot)).sequence,M.move(s,i,slot));
 }
});
test('recognized incomplete text retains a drawing; unsupported text does not',()=>{
 const s=S.create();s.text('dA-(s)-');assert.equal(s.get().drawing.length,2);assert.equal(s.get().textError,false);
 s.build(t=>B.insert(t,C,t.length));assert.equal(s.get().error,null);
 s.text('dA dC');assert.equal(s.get().textError,true);assert.equal(s.get().drawing.length,0);
 s.text('dA-');assert.equal(s.get().textError,false);assert.equal(s.get().drawing.at(-1).type,'PO');
 s.text('bad input');assert.equal(s.get().textError,true);
});
test('clear invalid drawing resets the complement and can undo back into the draft',()=>{
 const s=S.create();s.text('dA');s.toggleComplement();s.build(t=>B.insert(t,{kind:'link',type:'PS'},1));s.text('');
 assert.equal(s.get().drawing.length,0);assert.equal(s.get().error,null);assert.equal(s.get().complementOpen,false);
 s.undo();assert.equal(s.get().drawing.length,2);assert.ok(s.get().error);assert.equal(s.get().complementOpen,true);
});
