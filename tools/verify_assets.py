"""Validate all creator choices, world references and privacy/content boundaries."""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1];assets=root/'public/assets/game';raw=assets/'lpc/spritesheets'
errors=[];anims=['walk','idle','run','sit','emote']
paths=[]
for body in ['male','female']:
 paths += [f'body/bodies/{body}',f'head/heads/human/{body}']
 for top in ['shortsleeve/tshirt','shortsleeve/tshirt_vneck','shortsleeve/shortsleeve_polo','longsleeve/longsleeve','longsleeve/longsleeve2_cardigan','longsleeve/longsleeve2_buttoned','sleeveless/sleeveless2']:paths.append(f'torso/clothes/{top}/{body}')
 for legs in ['pants','cuffed','formal','shorts/shorts','leggings']:paths.append(f'legs/{legs}/'+('thin' if body=='female' else 'male'))
 for feet in ['shoes/basic','boots/basic','sandals']:paths.append(f'feet/{feet}/'+('thin' if body=='female' else 'male'))
paths += [str(p.relative_to(raw)) for p in (raw/'hair').glob('*/adult')]
paths += ['beards/beard/'+b for b in ['basic','trimmed','5oclock_shadow']]+['beards/mustache/basic']
for p in paths:
 for a in anims:
  if not(raw/p/(a+'.png')).exists():errors.append('Missing layer '+p+'/'+a)
for style in ['glasses','round','nerd','shades']:
 for a in anims:
  if not(raw/f'facial/glasses/{style}/adult/{a}/black.png').exists():errors.append('Missing glasses '+style+'/'+a)
world=json.loads((assets/'town.json').read_text())
for k in world['textures']:
 if not(assets/(k+'.png')).exists():errors.append('Missing world texture '+k)
if len(world['buildings'])!=7:errors.append('Expected seven buildings')
def free(x,y):return not any(x-10<s['x']+s['w'] and x+10>s['x'] and y-11<s['y']+s['h'] and y>s['y'] for s in world['solids'])
if not free(world['spawn']['x'],world['spawn']['y']):errors.append('Spawn is blocked')
for b in world['buildings']:
 if not free(b['doorX'],b['doorY']+22):errors.append('Door approach blocked: '+b['id'])
content=(root/'content/portfolio.ts').read_text()
if '3rbextreme.ma' in content:errors.append('Forbidden business website')
if re.search(r'\+\d{1,3}[\s-]*\d{6,}',content):errors.append('Personal phone contact in public source')
for d in ['atlas','city','roofs','colonial','interior','furniture','pixelify-sans']:
 if not(root/f'public/licenses/{d}.txt').exists():errors.append('Missing license '+d)
print(f'Checked {len(paths)*len(anims)+20} creator animation files, {len(world["textures"])} textures, spawn and 7 doors.')
if errors:print('\n'.join(errors));sys.exit(1)
print('Asset integrity and public content checks passed.')
