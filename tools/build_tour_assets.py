from PIL import Image,ImageOps,ImageEnhance,ImageDraw
from pathlib import Path
import json,io,base64,random,collections,argparse
args=argparse.ArgumentParser();args.add_argument("--character-sheet",required=True);args.add_argument("--prop-atlas",required=True);args=args.parse_args()
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'assets-src/tour';OUT.mkdir(parents=True,exist_ok=True)
TMP=ROOT/'public/assets/tour';TMP.mkdir(parents=True,exist_ok=True)
def save(name,im):
 b=io.BytesIO();im.save(b,format='PNG',optimize=True);data=b.getvalue();(OUT/(name+'.png.b64')).write_text(base64.b64encode(data).decode());(TMP/(name+'.png')).write_bytes(data)
def bg_remove(im,kind='magenta'):
 im=im.convert('RGBA');px=im.load();w,h=im.size
 if kind=='magenta':
  for y in range(h):
   for x in range(w):
    r,g,b,a=px[x,y]
    if r>55 and b>55 and r>g*1.6 and b>g*1.5:px[x,y]=(0,0,0,0)
 else:
  # Flood only edge-connected green background; preserve the sage shirt.
  seen=set();q=collections.deque([(x,0) for x in range(w)]+[(x,h-1) for x in range(w)]+[(0,y) for y in range(h)]+[(w-1,y) for y in range(h)])
  while q:
   x,y=q.popleft()
   if (x,y) in seen or x<0 or y<0 or x>=w or y>=h:continue
   seen.add((x,y));r,g,b,a=px[x,y]
   if g>r*1.12 and g>b*1.05 and r<65 and g<115:
    px[x,y]=(0,0,0,0);q.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
 return im
# Owner-provided exact character art; do not redraw the face.
sheet=Image.open(args.character_sheet)
w,h=sheet.size;sheet=sheet.resize((1254,1254))
for name,box in {'portrait':(18,16,456,654),'happy':(700,582,861,804),'thinking':(1061,582,1227,804)}.items():
 im=sheet.crop(box);im.thumbnail((220,260));save('jalal-'+name,im)
idleboxes=[(990,44,1091,251),(1115,46,1229,250),(721,48,827,252),(849,48,961,252)]
walkboxes=[(986,284,1096,487),(1109,282,1238,487),(719,284,830,487),(844,281,969,487)]
frames=[]
for boxes in [idleboxes,walkboxes]:
 arr=[]
 for box in boxes:
  im=bg_remove(sheet.crop(box),'green');bb=im.getbbox();im=im.crop(bb) if bb else im;im.thumbnail((40,54),Image.Resampling.NEAREST);f=Image.new('RGBA',(64,64));f.alpha_composite(im,((64-im.width)//2,56-im.height));arr.append(f)
 frames.append(arr)
sprites=Image.new('RGBA',(576,1280))
for ai,anim in enumerate(['walk','idle','run','sit','emote']):
 for d in range(4):
  for j in range(9):
   f=frames[0][d].copy()
   if anim in ['walk','run']:
    f=frames[1 if j%4 in (1,2) else 0][d].copy()
    if j%4==3 and d in (0,2):f=ImageOps.mirror(frames[1][d])
   if anim=='sit':
    # Fixed resting pose; no alternating sit/stand loop.
    body=f.crop((0,0,64,48));f=Image.new('RGBA',(64,64));f.alpha_composite(body,(0,8))
   sprites.alpha_composite(f,(j*64,(ai*4+d)*64))
save('jalal-sheet',sprites)
# Original generated domain props. Deliberately extracted individually: generator did not honor the atlas grid.
atlas=Image.open(args.prop_atlas).resize((1408,768))
boxes={'server':(20,0,275,503),'telescope':(298,0,537,262),'microscope':(590,0,828,258),'phone':(863,18,1128,225),'security':(299,270,544,500),'workstation':(562,270,851,509),'kitchen':(859,281,1138,512),'files':(1187,262,1379,754),'planning':(6,545,258,739),'notebook':(285,541,546,768),'printer':(581,516,827,759),'seat':(897,520,1101,768)}
for name,box in boxes.items():
 im=bg_remove(atlas.crop(box));im=im.crop(im.getbbox());im.thumbnail((96,128) if name in ['server','files'] else (112,96),Image.Resampling.NEAREST);save('prop-'+name,im)
places=json.loads((ROOT/'test-results/tour-catalog.json').read_text());rng=random.Random(82)
W,H=2432,2336;ground=Image.new('RGBA',(W,H));terrain=Image.open(ROOT/'tools/source/terrain.png').convert('RGBA');furniture=Image.open(ROOT/'tools/source/furniture.png').convert('RGBA')
grass=terrain.crop((21*32,5*32,22*32,6*32));grass=ImageEnhance.Color(grass).enhance(.65)
# A retained licensed cobble tile used as an intentionally continuous village road.
road=Image.open(ROOT/'public/assets/game/town-ground.png').crop((27*32,33*32,28*32,34*32));road=ImageEnhance.Brightness(road).enhance(1.1)
for y in range(0,H,32):
 for x in range(0,W,32):ground.alpha_composite(grass,(x,y))
world=[];objects=[];solids=[]
for row in range(5):
 ry=384+row*416
 for y in range(ry-32,ry+64,32):
  for x in range(128,W-128,32):ground.alpha_composite(road,(x,y))
for col in range(5):
 cx=320+col*448
 for y in range(256,H-96,32):
  for x in range(cx-32,cx+64,32):ground.alpha_composite(road,(x,y))
for n,p in enumerate(places):
 row=n//5;col=n%5 if row%2==0 else 4-n%5;cx=320+col*448;doorY=384+row*416
 base=['about','academy','office','library','workshop','contact','lab'][n%7];fac=Image.open(ROOT/f'public/assets/game/house-{base}.png').convert('RGBA')
 targetw=[160,192,256,144,224,128,288][n%7];targeth=[192,256,224,176,240][n%5]
 fac=fac.resize((targetw,targeth),Image.Resampling.NEAREST)
 # Unique material tint per building, maintaining pixel shading.
 lum=ImageOps.grayscale(fac);tints=[('#3c332c','#d0b18a'),('#303c3c','#a8c6bd'),('#42373d','#c5a9b8'),('#3b3d31','#bac59d'),('#42322d','#cda180')];lo,hi=tints[n%5]
 tinted=ImageOps.colorize(lum,lo,hi).convert('RGBA');tinted.putalpha(fac.getchannel('A'));fac=Image.blend(fac,tinted,.36)
 save('house-'+p['id'],fac);x=cx-targetw//2;y=doorY-targeth-24
 b=dict(id=p['id'],x=x,y=y,w=targetw,h=targeth,doorX=cx,doorY=doorY,name=p['name']);world.append(b)
 objects.append(dict(key='house-'+p['id'],x=x,y=y,depth=y+targeth));solids.append(dict(x=x+5,y=y+targeth-64,w=targetw-10,h=58))
 for dx in [-48,targetw+16]:objects.append(dict(key='plant',x=x+dx,y=y+targeth-24,depth=y+targeth+8))
 # Resize room surfaces by tiling licensed source pixels, not stretching furniture.
 old=Image.open(ROOT/f'public/assets/rooms/floor-{p["theme"]}.png').convert('RGBA');floor=old.crop((0,128,32,160));wall=old.crop((0,0,32,96));room=Image.new('RGBA',(p['width'],p['height']))
 for yy in range(96,p['height'],32):
  for xx in range(0,p['width'],32):room.alpha_composite(floor,(xx,yy))
 for xx in range(0,p['width'],32):room.alpha_composite(wall,(xx,0))
 rug=Image.open(ROOT/'public/assets/game/rug.png').convert('RGBA').resize((96,64),Image.Resampling.NEAREST);room.alpha_composite(rug,(p['width']//2-48,p['height']-96));save('room-'+p['id'],room)
# Trees at edges and between plots, without touching continuous walking roads.
for x in range(0,W,96):
 for y in [0,H-140]:objects.append(dict(key='tree',x=x,y=y,depth=y+144))
for y in range(160,H-160,128):
 for x in [0,W-96]:objects.append(dict(key='pine',x=x,y=y,depth=y+144))
for row in range(5):
 for col in range(4):
  x=512+col*448;y=160+row*416
  if y<H-180:objects.append(dict(key='tree',x=x,y=y,depth=y+144))
for n,b in enumerate(world):
 objects.append(dict(key='lamp',x=b['doorX']+92,y=b['doorY']-36,depth=b['doorY']+26))
 # Street-side seating is outside the road's collision corridor.
 objects.append(dict(key='bench',x=b['doorX']+125,y=b['doorY']+56,depth=b['doorY']+120))
# Distinct gardens beside the plots, plus a public park in the unoccupied final row.
for n,b in enumerate(world):
 for j in range(3):
  fx=b['doorX']-155+j*32;fy=b['doorY']-62
  objects.append(dict(key='flowers',x=fx,y=fy,depth=fy+32))
 if n%3==0:objects.append(dict(key='barrel',x=b['doorX']+152,y=b['doorY']-70,depth=b['doorY']-6))
for col in range(1,5):
 cx=320+col*448;cy=1840
 objects.append(dict(key='fountain' if col==2 else 'well',x=cx-48,y=cy-70,depth=cy+26))
 solids.append(dict(x=cx-42,y=cy-28,w=84,h=44))
 for dx in [-116,88]:objects.append(dict(key='plant',x=cx+dx,y=cy+8,depth=cy+40))
 for dx in [-132,100]:objects.append(dict(key='tree',x=cx+dx,y=cy-164,depth=cy-20))
 for dx in [-100,-68,-36,36,68,100]:objects.append(dict(key='flowers',x=cx+dx,y=cy+70,depth=cy+102))
save('ground',ground)
worlddata=dict(width=W,height=H,spawn={'x':320,'y':464},buildings=world,objects=objects,solids=solids)
(ROOT/'game/tour-world.json').write_text(json.dumps(worlddata,separators=(',',':')))
preview=ground.copy()
for o in sorted(objects,key=lambda o:o['depth']):
 path=TMP/(o['key']+'.png') if o['key'].startswith('house-') else ROOT/'public/assets/game'/(o['key']+'.png')
 preview.alpha_composite(Image.open(path).convert('RGBA'),(o['x'],o['y']))
preview.thumbnail((1100,1100),Image.Resampling.NEAREST);save('map',preview)
print('Built',len(world),'individual buildings and rooms; original character and domain props')
