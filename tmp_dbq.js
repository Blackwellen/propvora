const fs = require('fs');
let t = '';
try { t += fs.readFileSync('.env', 'utf8') + '\n'; } catch (e) {}
try { t += fs.readFileSync('.env.local', 'utf8'); } catch (e) {}
t = t.replace(/\r/g, '');
const g = (k) => {
  const m = t.match(new RegExp('^\\s*' + k + '\\s*=\\s*(.*)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};
const tok = g('SUPABASE_PERSONAL_ACCESS_KEY');
const ref = new URL(g('NEXT_PUBLIC_SUPABASE_URL')).hostname.split('.')[0];
const sql = process.argv[2];
fetch('https://api.supabase.com/v1/projects/' + ref + '/database/query', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
  .then((r) => r.json())
  .then((j) => console.log(JSON.stringify(j)))
  .catch((e) => console.error('ERR', e));
