/* designed/corrected by YZ, implemented by openAI */
// Read-only audit of a selected Codex session log; does not copy conversation text.
const fs = require('node:fs');
const path = require('node:path');
function audit(content) {
  const fields = ['input_tokens','cached_input_tokens','cache_write_input_tokens','output_tokens','reasoning_output_tokens','total_tokens'];
  const zero = () => Object.fromEntries(fields.map(k=>[k,0]));
  let previous = zero(), accumulated = zero(), baseline = zero(), latest = null;
  let sessionId = null, turnId = null, turnStartedAt = null, turnComplete = false, samples = 0;
  let cacheAvailable = true, outputAvailable = true, malformedLines = 0;
  const warnings = [], seen = new Set();
  const lines = content.split(/\r?\n/);
  for (let i=0;i<lines.length;i++) {
    const line=lines[i]; if(!line.trim()) continue;
    let e; try { e=JSON.parse(line); } catch { malformedLines++; continue; }
    const p=e.payload || {};
    if(e.type==='session_meta') sessionId=p.id;
    if(e.type!=='event_msg') continue;
    if(p.type==='task_started') { baseline={...accumulated};turnId=p.turn_id;turnStartedAt=e.timestamp;turnComplete=false; }
    if(p.type==='task_complete' && p.turn_id===turnId) turnComplete=true;
    if(p.type!=='token_count' || !p.info?.total_token_usage) continue;
    const t=p.info.total_token_usage;
    const identity=JSON.stringify([e.timestamp,t]); if(seen.has(identity)) continue; seen.add(identity);
    cacheAvailable &&= Number.isFinite(t.cached_input_tokens);
    outputAvailable &&= Number.isFinite(t.output_tokens);
    if(!Number.isFinite(t.input_tokens)) { warnings.push('Input counter missing; skipped a sample.'); continue; }
    if(t.input_tokens<previous.input_tokens) { warnings.push('Cumulative counters reset; exact totals unavailable.'); break; }
    for(const key of fields) accumulated[key]+= (Number.isFinite(t[key])?t[key]:0)-previous[key];
    previous=Object.fromEntries(fields.map(k=>[k,Number.isFinite(t[k])?t[k]:0]));
    latest=e.timestamp; samples++;
  }
  function metrics(t) {
    return {
      input_tokens:t.input_tokens,
      cached_input_tokens:cacheAvailable?t.cached_input_tokens:null,
      uncached_input_tokens:cacheAvailable?t.input_tokens-t.cached_input_tokens:null,
      cache_hit_percent:cacheAvailable && t.input_tokens?Number((100*t.cached_input_tokens/t.input_tokens).toFixed(2)):null,
      output_tokens:outputAvailable?t.output_tokens:null,
      reasoning_output_tokens:t.reasoning_output_tokens,
      total_tokens:t.total_tokens
    };
  }
  if(malformedLines) warnings.push(`${malformedLines} malformed/partial log line(s) skipped.`);
  if(!samples) warnings.push('No usable token counters found; zero values are not verified usage.');
  return {
    session_id:sessionId,as_of_utc:latest,usage_samples:samples,
    session_total:metrics(accumulated),
    current_turn:{turn_id:turnId,started_at_utc:turnStartedAt,complete:turnComplete,...metrics(Object.fromEntries(fields.map(k=>[k,accumulated[k]-baseline[k]])))},
    warnings,
    notes:['Cached input is part of total input, not an additional category to add.','Uncached input = input - cached input.','Reasoning output is a subset of output; do not add it again.','A snapshot excludes work after its timestamp, including the final reply if still in progress.','Totals count repeated context on each model call. Local counters are not an invoice.']
  };
}
module.exports = {audit};
if(require.main===module) {
  const source=process.argv[2];
  if(!source) { console.error('Usage: node tools/token-usage.cjs <session.jsonl> [output.json]'); process.exitCode=1; }
  else {
    const report=audit(fs.readFileSync(source,'utf8'));
    const text=JSON.stringify(report,null,2)+'\n';
    if(process.argv[3]) { const output=path.resolve(process.argv[3]);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,text); }
    console.log(text);
  }
}
