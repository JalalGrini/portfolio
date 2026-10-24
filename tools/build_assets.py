"""Rebuild the local art bundle. Python 3 + Pillow. No network/credentials needed.
Source atlases in tools/source retain upstream license files in public/licenses.
LPC source layers are already curated in public/assets/game/lpc/spritesheets.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance
import json, random
ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/'tools/source'; OUT=ROOT/'public/assets/game'; OUT.mkdir(parents=True,exist_ok=True)
R=random.Random(37); T=32; W,H=56,44
A={n:Image.open(SRC/(n+'.png')).convert('RGBA') for n in ['base','terrain','city','houses','colonial','furniture','interior','laptop','mailboxes']}
def crop(n,x,y,w,h): return A[n].crop((x,y,x+w,y+h))
def tile(n,x,y,w=1,h=1):return crop(n,x*T,y*T,w*T,h*T)
def grade(im):
    # Keep the artwork's pixel structure; a restrained green/sage cinema grade.
    im=ImageEnhance.Color(im).enhance(.70); return im
textures={}
def texture(name,im):
    im=grade(im); im.save(OUT/(name+'.png')); textures[name]=(im.width,im.height);return name

for key,cy in [('tree',12),('pine',15)]:
 im=Image.new('RGBA',(96,144));im.alpha_composite(tile('terrain',26,19,1,2),(32,80));im.alpha_composite(tile('terrain',24,cy,3,3),(0,0));texture(key,im)
texture('bush',tile('terrain',26,12,3,3))
texture('lamp',crop('city',676,322,26,62)); texture('well',crop('city',672,256,64,64))
texture('plant',tile('city',14,12,1,1));texture('flowers',tile('terrain',7,30,1,1));texture('barrel',tile('base',18,14,1,2))
texture('sign',tile('base',29,10,1,1));texture('bench',tile('interior',7,3,1,2))
pool=tile('city',6,0,3,3); pool.alpha_composite(tile('terrain',17,12,1,2),(32,0));texture('fountain',pool)
# House silhouettes from bluecarrot16's roof demonstration map. Overlay licensed doors/windows.
house_specs={
 'about':(224,96,160,192,'sage'), 'academy':(960,672,160,256,'stone'),
 'lab':(512,384,320,224,'sage'), 'office':(960,368,160,240,'stone'),
 'workshop':(352,384,128,224,'brick'), 'library':(1152,48,160,240,'stone'),
 'contact':(736,1056,96,160,'sage')}
# Exact RGB replacement of warm bricks, retaining value contrast and mortar detail.
for key,(x,y,w,h,tint) in house_specs.items():
 im=crop('houses',x,y,w,h)
 if tint!='brick':
  p=im.load()
  for yy in range(h):
   for xx in range(w):
    r,g,b,a=p[xx,yy]
    if a and r>g*1.20 and r>b*1.18:
     v=(r*.30+g*.58+b*.12); p[xx,yy]=(int(v*.96),int(v*1.06),int(v*.92),a) if tint=='sage' else (int(v*1.14),int(v*1.08),int(v*.98),a)
 # Ground-facing door aligned with collision footprint center.
 door=tile('base',5,9,1,2)
 im.alpha_composite(door,(w//2-16,h-64))
 window=tile('base',8,9,1,2)
 if w>=128:
  im.alpha_composite(window,(24,h-64)); im.alpha_composite(window,(w-56,h-64))
 texture('house-'+key,im)
# Floor and wall/furniture crops are original LPC pixel art, not primitive stand-ins.
texture('laptop',tile('laptop',1,0));texture('mailboxes',tile('mailboxes',1,1,1,2))
texture('bookshelf',tile('furniture',9,1,2,2));texture('desk',tile('furniture',8,7,3,1));texture('chair',tile('interior',7,3,1,2));texture('bed',tile('interior',0,5,2,3));texture('rug',tile('interior',6,1,1,1));texture('cabinet',tile('furniture',0,1,2,2));texture('piano',tile('furniture',6,3,4,3))
# World ground: grass under a quadrant-autotiled cobble network.
ground=Image.new('RGBA',(W*T,H*T),(61,91,48,255)); mask=set()
def rectpath(x0,y0,x1,y1):
 for yy in range(y0,y1):
  for xx in range(x0,x1):mask.add((xx,yy))
rectpath(26,12,30,43);rectpath(12,26,45,30);rectpath(22,19,34,31)
buildings=[
 dict(id='about',name='The Green House',label='About me',x=8*32,y=17*32),
 dict(id='academy',name='ENSAH Academy',label='Education',x=8*32,y=5*32),
 dict(id='lab',name='The AI Observatory',label='AI & research',x=23*32,y=4*32),
 dict(id='office',name='The Engineering Office',label='Experience',x=41*32,y=6*32),
 dict(id='workshop',name='The Makers Workshop',label='Software projects',x=42*32,y=20*32),
 dict(id='library',name='The Knowledge Library',label='Skills',x=38*32,y=31*32),
 dict(id='contact',name='The Post Office',label='Contact & CV',x=17*32,y=33*32)]
objects=[];solids=[]
def obj(key,x,y,solid=None):
 w,h=textures[key]; objects.append(dict(key=key,x=int(x),y=int(y),depth=int(y+h)))
 if solid:solids.append(dict(x=int(x+solid[0]),y=int(y+solid[1]),w=solid[2],h=solid[3]))
for b in buildings:
 key='house-'+b['id']; w,h=textures[key];b.update(w=w,h=h,doorX=b['x']+w//2,doorY=b['y']+h+12)
 obj(key,b['x'],b['y'],(3,h-70,w-6,68))
 dx=int(b['doorX']//32); dy=int(b['doorY']//32)
 rectpath(dx-1,dy,dx+2,dy+2)
 # Every front door gets a continuous road back to the central network.
 if b['id'] in ['academy','office','lab']:
  rectpath(dx-1,dy,dx+2,18);rectpath(min(dx,28)-1,16,max(dx,28)+2,19)
 elif b['id'] in ['library','contact']:
  rectpath(dx-1,dy,dx+2,41);rectpath(min(dx,28)-1,39,max(dx,28)+2,42)
 else:rectpath(dx-1,dy,dx+2,29)
for yy in range(H):
 for xx in range(W):
  if (xx,yy) not in mask:
   # LPC grass sprig variants over an understated grass base.
   if R.random()<.33:
    sprig=tile('terrain',21+R.randrange(3),5);px=sprig.load();ramp={(47,129,54):(61,91,48),(100,164,44):(85,120,54),(73,146,49):(72,106,50)}
    for sy in range(32):
     for sx in range(32):
      r,g,b,a=px[sx,sy];px[sx,sy]=ramp.get((r,g,b),(r,g,b))+(a,)
    ground.alpha_composite(sprig,(xx*T,yy*T))
   continue
  for qy in range(2):
   for qx in range(2):
    sx=-1 if qx==0 else 1;sy=-1 if qy==0 else 1
    nx=(xx+sx,yy) in mask;ny=(xx,yy+sy) in mask;nd=(xx+sx,yy+sy) in mask
    cx=(1 if nx else (0 if qx==0 else 2));cy=(3 if ny else (2 if qy==0 else 4))
    if nx and ny and not nd:cx=(0 if qx==0 else 2);cy=(0 if qy==0 else 1)
    patch=crop('terrain',(15+cx)*32+qx*16,cy*32+qy*16,16,16)
    ground.alpha_composite(patch,(xx*32+qx*16,yy*32+qy*16))
# Trees form a soft, irregular forest edge; every path remains open.
occupied=[(b['x']-50,b['y']-40,b['x']+b['w']+50,b['y']+b['h']+80) for b in buildings]
for yy in range(0,H,3):
 for xx in range(0,W,3):
  edge=xx<4 or xx>W-6 or yy<3 or yy>H-5
  if not edge and R.random()>.24:continue
  x=xx*32+R.randint(-12,12);y=yy*32+R.randint(-15,10)
  # test foot and canopy against road/building envelopes
  if any((tx,ty) in mask for tx in range(max(0,xx-1),min(W,xx+4)) for ty in range(max(0,yy),min(H,yy+5))):continue
  if any(x<r and x+96>l and y<bb and y+150>t for l,t,r,bb in occupied):continue
  key=R.choice(['tree','pine','tree']);w,h=textures[key];obj(key,x,y,(32,h-24,32,20))
# Fountain, benches, lamps, flower pots and a small water garden.
obj('fountain',26*32,23*32,(4,38,88,56))
for x,y in [(23,24),(32,24),(23,29),(32,29),(15,18),(39,18),(23,36),(32,36)]:obj('lamp',x*32,y*32,(7,45,15,15))
for x,y in [(23,26),(32,26),(24,32),(31,32)]:obj('bench',x*32,y*32,(0,10,64,20))
for b in buildings:
 for dx in [-32,b['w']]:obj('plant',b['x']+dx,b['y']+b['h']-26,(5,20,22,10))
# Keep tree canopies clear of the water garden.
objects=[o for o in objects if not (o['key'] in ['tree','pine'] and o['x']<22*32 and o['x']+96>17*32 and o['y']<27*32 and o['y']+144>22*32)]
for i in range(170):
 x=R.randrange(4,W-4);y=R.randrange(4,H-4)
 if (x,y) in mask or any(x*32<r and x*32+32>l and y*32<bb and y*32+32>t for l,t,r,bb in occupied):continue
 if R.random()<.5:obj('flowers',x*32,y*32)
# A pond assembled with LPC edge tiles.
for yy in range(5):
 for xx in range(5):
  cx=0 if xx==0 else (2 if xx==4 else 1);cy=0 if yy==0 else (2 if yy==4 else 1)
  ground.alpha_composite(tile('terrain',9+cx,11+cy),(17*32+xx*32,22*32+yy*32))
solids.append(dict(x=17*32+10,y=22*32+10,w=140,h=140))
ground=grade(ground);ground.save(OUT/'town-ground.png')
data=dict(width=W*T,height=H*T,spawn=dict(x=28*32,y=34*32),buildings=buildings,objects=objects,solids=solids,textures=list(textures))
(OUT/'town.json').write_text(json.dumps(data,separators=(',',':')))
preview=ground.copy()
for o in sorted(objects,key=lambda o:o['depth']):preview.alpha_composite(Image.open(OUT/(o['key']+'.png')),(o['x'],o['y']))
preview.save(OUT/'town-preview.png');preview.crop((16*32,14*32,42*32,37*32)).save(OUT/'town-cover.png')
# Furnished, walkable interior maps; interaction displays are described by JSON.
room=Image.new('RGBA',(22*32,16*32),(36,37,31,255))
for y in range(16):
 for x in range(22):
  im=tile('furniture',0,3) if y>2 else tile('interior',2,8+y)
  room.alpha_composite(im,(x*32,y*32))
room=grade(room);room.save(OUT/'room-ground.png')
print('Built world:',len(objects),'objects,',len(solids),'solid footprints,',len(textures),'textures')
