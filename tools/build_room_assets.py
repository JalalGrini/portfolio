"""Derive room surfaces/props from retained LPC atlases; no network assets.
Run before commit; builds decode versioned bytes offline via prepare-studio-assets.
See public/licenses/interior.txt and furniture.txt for source authors/licenses.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import base64, io
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'tools/source'; OUT=ROOT/'assets-src/rooms'; OUT.mkdir(exist_ok=True,parents=True)
f=Image.open(SRC/'furniture.png').convert('RGBA'); i=Image.open(SRC/'interior.png').convert('RGBA')
def save(name,im):
 b=io.BytesIO();im.save(b,format='PNG',optimize=True);(OUT/(name+'.png.b64')).write_text(base64.b64encode(b.getvalue()).decode()+'\n')
def cut(im,box):
 o=im.crop(box)
 if im is f:
  # Remove the exact atlas-floor palette, retaining furniture colors and outlines.
  bg=f.crop((0,96,32,128)); palette=set(bg.getdata());pix=o.load()
  for yy in range(o.height):
   for xx in range(o.width):
    if pix[xx,yy] in palette:
     pix[xx,yy]=(0,0,0,0)
 return o
def tinted(im,low,high):
 a=im.getchannel('A');o=ImageOps.colorize(ImageOps.grayscale(im),low,high).convert('RGBA');o.putalpha(a);return o
floor=f.crop((0,96,32,128))
wall=Image.open(ROOT/'public/assets/game/room-ground.png').convert('RGBA').crop((0,0,32,96))
specs={
 'about':('#44372a','#b8a071','#284634','#b3c4a0'),
 'academy':('#524533','#d0b689','#393f50','#b9bdc7'),
 'lab':('#263740','#809d9e','#203b48','#8aadb8'),
 'office':('#443128','#ba946d','#354338','#a4b092'),
 'workshop':('#493028','#bc885b','#543b2b','#c3a270'),
 'library':('#3a302d','#a08763','#403a43','#b0a0a8'),
 'contact':('#55412c','#c5a975','#334d4a','#b1c4ae')}
for key,(lo,hi,wl,wh) in specs.items():
 room=Image.new('RGBA',(704,512)); ft=tinted(floor,lo,hi);wt=tinted(wall,wl,wh)
 for y in range(96,512,32):
  for x in range(0,704,32):room.alpha_composite(ft,(x,y))
 for x in range(0,704,32):room.alpha_composite(wt,(x,0))
 # Actual source rugs, repeated as woven panels rather than primitive stand-ins.
 rug=i.crop((192,32,224,64));rug=ImageEnhance.Color(rug).enhance(.6)
 room.alpha_composite(rug.resize((128,96),Image.Resampling.NEAREST),(288,352))
 save('floor-'+key,room)
props={
 'round-table':(i,(128,176,192,256)),
 'reading-lamp':(i,(352,192,384,224)),
 'blue-vase':(i,(224,224,256,272)),
 'wall-clock':(f,(224,0,256,96)),
 'archive':(f,(416,16,448,96)),
 'workbench':(f,(192,204,320,248)),
 'long-counter':(f,(192,204,320,248)),
 'reading-bench':(f,(352,320,416,352)),
 'small-stool':(i,(192,152,224,176))}
props.update({
 'desk':(f,(256,224,352,256)), 'bookshelf':(f,(288,32,352,96)),
 'cabinet':(f,(0,32,64,96)), 'piano':(f,(192,96,320,192))})
for key,(im,box) in props.items():
 sprite=cut(im,box)
 if key=='wall-clock':
  palette=set(f.crop((0,0,32,16)).getdata());px=sprite.load()
  for yy in range(sprite.height):
   for xx in range(sprite.width):
    if px[xx,yy] in palette:px[xx,yy]=(0,0,0,0)
 if key=='desk':sprite=i.crop((128,176,192,256)).resize((96,64),Image.Resampling.NEAREST)
 save(key,ImageEnhance.Color(sprite).enhance(.75))
print('Prepared',len(specs),'LPC room surfaces and',len(props),'licensed props')
