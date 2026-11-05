/* designed/corrected by YZ, implemented by openAI */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('additional catalog chemistry supports multiletter prefixes without parser edits',()=>{
 const ctx=vm.createContext({});
 const run=f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f+'.js'),'utf8'),ctx);
 run('data/massData');run('data/chemistryCatalog');run('data/linkageData');
 vm.runInContext('MWCount.chemistryCatalog.TEST={prefix:"zz",label:"Test",bases:["A","C","G","U"],complement:{A:"U",U:"A",C:"G",G:"C"},derivesFrom:"RNA",delta:{}}',ctx);
 for(const f of ['data/chemistryData','core/sequenceModel','core/sequenceParser','core/sequenceSerializer','core/sequenceBuilder','core/complement'])run(f);
 const outcome=vm.runInContext('MWCount.parser.parse("zzA-(s)-dC")',ctx);
 assert.equal(outcome.ok,true);assert.equal(outcome.sequence.nucleotides[0].chemistry,'TEST');
 assert.equal(vm.runInContext('MWCount.builder.parse("zzA-(s)-")[0].chemistry',ctx),'TEST');
 assert.equal(vm.runInContext('MWCount.serializer.serialize(MWCount.complement.generate(MWCount.parser.parse("zzA").sequence))',ctx),'zzU');
});
