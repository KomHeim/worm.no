import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../public/artillery/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Artillery inline script exists');
assert.doesNotThrow(() => new Script(script), 'Artillery JavaScript parses');

for (const [name, value] of [['Rolling hills', 'hills'], ['Flat field', 'flat'], ['Giant U', 'u']]) {
  assert.match(html, new RegExp('<option value="' + value + '">Map: ' + name + '<\\/option>'), name + ' is selectable');
}
const source = html.match(/^function terrainHeight\(x,type,seed\)\{.*\}$/m)?.[0];
assert.ok(source, 'Pure terrain height function exists');
const height = runInNewContext(
  'const W=1024;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));' + source + ';terrainHeight',
  {}, { timeout: 1000 }
);
for (const x of [0, 100, 512, 875, 1023]) assert.equal(height(x,'flat',0), 372, 'Flat map level across width');
const left = height(0,'u',0), right = height(1024,'u',0), center = height(512,'u',0);
assert.ok(center - left > 200, 'U has a deep central basin');
assert.equal(left, right, 'U walls are symmetrical');
assert.ok(height(256,'u',0)>left && height(256,'u',0)<center, 'U transitions smoothly on the left');
assert.ok(height(768,'u',0)>right && height(768,'u',0)<center, 'U transitions smoothly on the right');
assert.notEqual(height(200,'hills',-100),height(200,'hills',100), 'Original map remains varied');

for (let i = 0; i < 4; i++) assert.match(html, new RegExp('data-weapon="' + i + '"'), 'Weapon ' + (i+1) + ' available');
assert.match(html, /ALL 4 UNLOCKED/);
assert.match(script, /phase==='menu'\|\|canControl\(\)/, 'Weapons can be selected before starting');
assert.match(script, /teamWeapons\[team\]=weapon/, 'Each team retains its equipped weapon');
assert.match(script, /terrainType=e\.target\.value/, 'Map picker changes terrain');
assert.match(script, /ctx\.drawImage\(floor,0,0\)/, 'Destructible terrain still drawn');
console.log('PASS: Artillery JS parses, three maps present, flat/U geometry, all four weapons selectable, and destructible terrain retained.');
