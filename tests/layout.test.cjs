/* designed/corrected by YZ, implemented by openAI */
const test=require('node:test'),assert=require('node:assert/strict');
for(const f of ['data/chemistryData','core/sequenceModel','core/sequenceParser','core/sequenceSerializer','core/sequenceBuilder','core/complement','ui/sequenceLayout'])require('../js/'+f+'.js');
const {layout:L,model:M,parser:P,builder:B}=MWCount;
const tokens=n=>M.tokens(P.parse(Array(n).fill('dA').join('-(s)-')).sequence);
test('20 per row maximum; next row owns the boundary PS and numbering continues',()=>{
 for(const n of [1,20,21,30,40,41,200]){
  const ts=tokens(n),rows=L.rows(ts,20);
  assert.equal(rows.length,Math.ceil(n/20));
  const reconstructed=rows.flatMap(r=>ts.slice(r.start,r.end));assert.deepEqual(reconstructed,ts);
  rows.forEach((r,i)=>{
   assert.ok(r.last-r.first+1<=20);assert.equal(r.first,i*20+1);
   assert.equal(ts[r.end-1].kind,'nucleotide');
   if(i){assert.equal(ts[r.start].kind,'link');assert.equal(ts[r.start].type,'PS');}
  });
 }
});
test('boundary drop slots preserve both sides of the carried PS',()=>{
 const ts=tokens(30),rows=L.rows(ts,20),boundary=rows[1].start;
 assert.equal(boundary,39);
 const n={kind:'nucleotide',chemistry:'DNA',base:'C'};
 const before=B.insert(ts,n,boundary),after=B.insert(ts,n,boundary+1);
 assert.equal(before[39].type,'PO');assert.equal(before[40].base,'C');assert.equal(before[41].type,'PS');
 assert.equal(after[39].type,'PS');assert.equal(after[40].base,'C');assert.equal(after[41].type,'PO');
 const slots=rows.flatMap((r,i)=>[r.start,...Array.from({length:r.end-r.start},(_,j)=>r.start+j+1).filter(k=>k<r.end||i===rows.length-1)]);
 assert.deepEqual(slots,Array.from({length:ts.length+1},(_,i)=>i));
});
test('all viewport widths keep 20 per row and use a measured scale',()=>{
 assert.equal(L.capacity(4000),20);assert.equal(L.capacity(800),20);assert.equal(L.capacity(50),20);
 for(const width of [400,600,800,1200,1800]){
  const limit=L.capacity(width),ts=tokens(30),rows=L.rows(ts,limit);
  assert.ok(rows.every(r=>r.last-r.first+1<=limit));
  assert.equal(rows[0].last,20);
 }
 assert.equal(L.scale(800,1600),0.5);assert.equal(L.scale(1800,1600),1);
 assert.equal(L.scale(0,1600),0);assert.equal(L.scale(800,0),1);
});
test('pending PS at an exact row limit remains visible and invalid',()=>{
 const ts=[...tokens(20),{kind:'link',type:'PS'}];const rows=L.rows(ts,20);
 assert.equal(rows.length,1);assert.equal(rows[0].end,ts.length);assert.equal(B.analyze(ts).valid,false);
});
test('3-prime to 5-prime complementary display pairs each base and linkage without changing the model',()=>{
 const source=P.parse('dA-(s)-mC-fG-rU').sequence;
 const c=MWCount.complement.generate(source),before=JSON.stringify(c);
 const display=L.displayTokens(M.tokens(c),true);
 assert.equal(B.serialize(display),'dT-(s)-mG-fC-rA');
 assert.equal(JSON.stringify(c),before);
 assert.deepEqual(display.filter(t=>t.kind==='link'),M.tokens(source).filter(t=>t.kind==='link'));
});
test('long complementary display retains source pairing across the 20-base boundary',()=>{
 const source=P.parse(Array.from({length:30},(_,i)=>['dA','rC','mG','fU'][i%4]).join('-(s)-')).sequence;
 const display=L.displayTokens(M.tokens(MWCount.complement.generate(source)),true);
 const bases=display.filter(t=>t.kind==='nucleotide');
 bases.forEach((n,i)=>{const original=source.nucleotides[i];assert.equal(n.chemistry,original.chemistry);assert.equal(n.base,MWCount.data.chemistries[original.chemistry].complement[original.base]);});
 const chunks=L.rows(display);assert.equal(chunks[0].last,20);assert.equal(display[chunks[1].start].kind,'link');
});
