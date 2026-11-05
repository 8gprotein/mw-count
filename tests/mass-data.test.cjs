const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('editing the separate mass table changes calculations without editing calculator code', () => {
  const context = vm.createContext({});
  const run = file => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file + '.js'), 'utf8'), context);
  run('data/massData');
  vm.runInContext('MWCount.massData.atomicMasses.C.average += 1', context);
  run('data/chemistryCatalog');
  run('data/chemistryData');
  run('core/sequenceModel');
  run('core/sequenceParser');
  run('core/sequenceSerializer');
  run('core/massCalculator');
  const result = vm.runInContext('MWCount.mass.calculate(MWCount.parser.parse("dA").sequence)', context);
  assert.equal(result.formula, 'C10H13N5O3');
  assert.ok(Math.abs(result.average - 261.246) < 1e-9);
});

test('invalid editable atomic mass is rejected at startup', () => {
  const context = vm.createContext({});
  const run = file => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file + '.js'), 'utf8'), context);
  run('data/massData');
  run('data/chemistryCatalog');
  vm.runInContext('MWCount.massData.atomicMasses.C.average = -1', context);
  assert.throws(() => run('data/chemistryData'), /Invalid atomic mass: C/);
});
