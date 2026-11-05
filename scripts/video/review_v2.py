"""Extract actual V2 frames at every persona change, key click and saved result."""
import argparse
import html
import json
from pathlib import Path
from render import run


def review(take):
    take=Path(take).resolve()
    manifest=json.loads((take/'scene-manifest-v2.json').read_text(encoding='utf-8'))
    output=take/'frames'/'review-v2';output.mkdir(parents=True,exist_ok=True)
    frames=[]
    for scene in manifest['scenes']:
        number=scene['number'];end=scene['actual_output_duration']
        shots=[('scene-start',.6),('final-result',end-.5)]
        shots += [(f'persona-{i+1}',r['at']+.5) for i,r in enumerate(scene['roles'])]
        shots += [(f'click-{i+1}',e['output_at']+.2) for i,e in enumerate(scene['interactions']) if e['type']=='important' and e['included']]
        shots += [(f'outcome-{i+1}',b['output_at']+.6) for i,b in enumerate(scene['visible_beats'])]
        for name,at in shots:
            at=max(.2,min(end-.2,at));target=output/f'scene-{number:02}-{name}.png'
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',at,'-i',take/scene['edited_clip_path'],'-frames:v','1',target])
            frames.append({'scene':number,'kind':name,'scene_at':at,'film_at':scene['start']+at,'path':str(target.relative_to(take))})
    (take/'visual-review-v2.json').write_text(json.dumps(frames,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Local offline index for the team's full-size frame review. No hosting needed.
    cards=[]
    for f in frames:
        label=f"Scene {f['scene']:02} · {f['kind']} · {f['film_at']:.2f}s"
        relative=Path(f['path']).relative_to('frames/review-v2').as_posix()
        cards.append(f'<figure><a href="{html.escape(relative)}"><img loading="lazy" src="{html.escape(relative)}" alt="{html.escape(label)}"></a><figcaption>{html.escape(label)}</figcaption></figure>')
    document='<!doctype html><meta charset="utf-8"><title>ClassAll V2 — QA frames</title><style>body{background:#f4f0ff;color:#30322f;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:20px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px}</style><h1>ClassAll V2 — QA frames</h1><p>Open a frame at full size. Then watch the complete MP4; frame review alone does not establish pacing or comprehension.</p><main>'+''.join(cards)+'</main>'
    (output/'index.html').write_text(document,encoding='utf-8')
    print(f'Extracted {len(frames)} review frames: {output / "index.html"}')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('take');args=parser.parse_args();review(args.take)
