/* designed/corrected by YZ, implemented by openAI */
const test=require('node:test');
const assert=require('node:assert/strict');
const {audit}=require('../tools/token-usage.cjs');
const event=(type,payload,timestamp='2026-09-05T19:00:00Z')=>JSON.stringify({type,timestamp,payload});
const count=(input,cached,output)=>({type:'token_count',info:{total_token_usage:{input_tokens:input,cached_input_tokens:cached,output_tokens:output,total_tokens:input+output,reasoning_output_tokens:3}}});
test('cumulative counters are not summed repeatedly; latest turn subtracts baseline',()=>{
  const lines=[event('session_meta',{id:'test'}),event('event_msg',{type:'task_started',turn_id:'one'}),event('event_msg',count(100,80,10)),event('event_msg',count(100,80,10)),event('event_msg',{type:'task_started',turn_id:'two'}),event('event_msg',count(300,230,30),'2026-09-05T19:01:00Z')].join('\n');
  const out=audit(lines);assert.equal(out.session_total.input_tokens,300);assert.equal(out.current_turn.input_tokens,200);assert.equal(out.current_turn.cached_input_tokens,150);assert.equal(out.current_turn.uncached_input_tokens,50);assert.equal(out.current_turn.output_tokens,20);assert.equal(out.current_turn.cache_hit_percent,75);
});
test('missing cache counters remain unknown; partial lines do not leak or crash',()=>{
  const out=audit(event('event_msg',{type:'token_count',info:{total_token_usage:{input_tokens:10,output_tokens:2,total_tokens:12}}})+'\n{');
  assert.equal(out.session_total.cached_input_tokens,null);assert.equal(out.session_total.uncached_input_tokens,null);assert.ok(out.warnings.length);
});
