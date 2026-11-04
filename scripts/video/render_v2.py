"""V2 editorial cut and later human-voice assembly. Reuses V1 FFmpeg helpers."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
from render import probe, run, stamp

ROOT = Path(__file__).resolve().parents[2]
DEFAULT = Path(__file__).with_name('scenes-v2.json')
PERSONAS = {
    0: ('ClassAll', 'Aprender juntos. Reconocer fortalezas. Apoyar a tiempo.'),
    1: ('Laura Martín', 'ESTUDIANTE · BUSCA APOYO'),
    2: ('David Chen', 'ESTUDIANTE / TUTOR · COMPARTE CONOCIMIENTOS'),
    3: ('Elena García', 'PROFESORA · ORIENTA EL APOYO'),
}

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def configuration(path):
    config = read(path)
    assert config['version'] == 2
    assert (config['width'], config['height'], config['fps']) == (1920,1080,30)
    assert [s['number'] for s in config['scenes']] == list(range(1,10))
    total = 0
    for s in config['scenes']:
        duration = s['duration']
        assert math.isfinite(duration) and duration > 0 and abs(duration*30-round(duration*30)) < 1e-6
        assert 0 <= s.get('voice_offset',0) < duration
        total += duration
    assert total < 180, 'The complete film must remain strictly below 180 seconds'
    return config

def keep_ranges(record, raw_duration):
    # Keep meaningful outcomes and their actual triggering clicks. Routine typing
    # and navigation are cut; no saved outcome or pointer movement is invented.
    intervals = [(max(0,b['at']-.3), min(raw_duration,b['at']+b['duration'])) for b in record['beats']]
    intervals += [(max(0,e['at']-.85),min(raw_duration,e['at']+1.0)) for e in record['events'] if e['type']=='important']
    # Preserve the real click immediately preceding each meaningful checkpoint,
    # including optional Learning Check submission and evidence disclosures.
    clicks = [e for e in record['events'] if e['type']=='click' and e.get('trusted')]
    for beat in record['beats']:
        prior = [e for e in clicks if e['at'] <= beat['at']]
        if prior:
            click = prior[-1]
            intervals.append((max(0,click['at']-.85),min(raw_duration,click['at']+1.0)))
    merged = []
    for start,end in sorted(intervals):
        if end <= start: continue
        if merged and start <= merged[-1][1]+.25:
            merged[-1][1] = max(end,merged[-1][1])
        else: merged.append([start,end])
    assert merged, 'No actual recorded beats'
    return merged

def mapped(raw, ranges, speed):
    position=0.
    for start,end in ranges:
        if raw < start: return position
        if raw <= end: return position+(raw-start)/speed
        position += (end-start)/speed
    return position

def font_setup(take, font):
    candidates = [Path(font)] if font else []
    if not font:
        if os.environ.get('WINDIR'): candidates.append(Path(os.environ['WINDIR'])/'Fonts'/'arial.ttf')
        candidates += [Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),Path('/System/Library/Fonts/Supplemental/Arial.ttf')]
    selected=next((p for p in candidates if p.is_file()),None)
    if not selected: raise RuntimeError('Pass --font with a Unicode TrueType font')
    shutil.copyfile(selected,take/'v2-font.ttf')

def text_filter(take, name, text, size, color, x, y, enable=None):
    (take/name).write_text(text,encoding='utf-8')
    result=f'drawtext=fontfile=v2-font.ttf:textfile={name}:fontsize={size}:fontcolor={color}:x={x}:y={y}'
    if enable: result += f":enable='{enable}'"
    return result

def encode_scene(take, scene, record):
    n=scene['number']; duration=scene['duration']
    source=take/record['source']; info=probe(source)
    raw_duration=float(info['format']['duration'])
    ranges=keep_ranges(record,raw_duration)
    kept=sum(end-start for start,end in ranges)
    # Never accelerate meaningful actions beyond 1.35x. Short scenes fail loudly.
    speed=max(.8,kept/duration)
    if speed > 1.35: raise RuntimeError(f'Scene {n}: meaningful footage needs {kept/1.35:.2f}s, assigned {duration}s')
    motion=kept/speed
    video=next(s for s in info['streams'] if s['codec_type']=='video')
    source_range='full' if video.get('color_range')=='pc' else 'tv'
    split=''.join(f'[s{i}]' for i in range(len(ranges)))
    filters=[f'[0:v]split={len(ranges)}{split}']
    for i,(start,end) in enumerate(ranges):
        filters.append(f'[s{i}]trim=start={start}:end={end},setpts=(PTS-STARTPTS)/{speed}[p{i}]')
    pieces=''.join(f'[p{i}]' for i in range(len(ranges)))
    filters.append(f'{pieces}concat=n={len(ranges)}:v=1:a=0,fps=30,scale=1748:984:flags=lanczos:in_range={source_range}:out_range=tv:out_color_matrix=bt709,setsar=1,pad=1920:1080:86:0:color=0xf8f7f2,tpad=stop_mode=clone:stop_duration={max(0,duration-motion)+.2},trim=duration={duration}[film]')
    # A dedicated band below the complete application avoids covering controls.
    overlays=['drawbox=x=0:y=984:w=1920:h=96:color=0xf4f0ff:t=fill',
              'drawbox=x=48:y=1004:w=5:h=55:color=0x7460c7:t=fill']
    roles=[]
    for e in record['events']:
        if e['type']=='persona':
            at=mapped(e['at'],ranges,speed)
            if roles and abs(at-roles[-1][0])<.001: roles[-1]=(at,e['id'])
            elif not roles or roles[-1][1] != e['id']: roles.append((at,e['id']))
    if not roles: roles=[(0,0)]
    roles[0]=(0,roles[0][1])
    for i,(start,identity) in enumerate(roles):
        end=roles[i+1][0] if i+1<len(roles) else duration
        if end-start<.04: continue
        name,role=PERSONAS[identity]
        enable=f'gte(t,{start})*lt(t,{end})'
        overlays.append(text_filter(take,f'v2-{n}-role-{i}.txt',name,29,'0x514090',72,997,enable))
        overlays.append(text_filter(take,f'v2-{n}-description-{i}.txt',role,19,'0x56594f',72,1038,enable))
    # Short editorial connections, visually separate from actual app evidence.
    overlays.append(text_filter(take,f'v2-{n}-message.txt',scene['message'],25,'0x514090',1000,1004))
    overlays.append(text_filter(take,f'v2-{n}-detail.txt',scene.get('detail',''),19,'0x56594f',1000,1040))
    overlays += [f'fade=t=in:st=0:d=0.15',f'fade=t=out:st={duration-.15}:d=0.15','format=yuv420p']
    filters.append('[film]'+','.join(overlays)+'[out]')
    script=take/f'v2-filter-{n:02}.txt';script.write_text(';\n'.join(filters),encoding='utf-8')
    target=take/'edited'/f'v2-scene-{n:02}.mp4'
    pending=target.with_name(target.stem+'.pending.mp4')
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',source,'-filter_complex_script',script,'-map','[out]','-an','-c:v','libx264','-preset','fast','-crf','18','-threads','2','-filter_complex_threads','2','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv','-movflags','+faststart',pending],cwd=take)
    actual=validate_clip(pending,duration)
    pending.replace(target)
    clicks=[{**e,'output_at':mapped(e['at'],ranges,speed),'included':any(a<=e['at']<=b for a,b in ranges)} for e in record['events'] if e['type'] in ('click','important')]
    return {**scene,'source_recording_path':record['source'],'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'edited_clip_path':str(target.relative_to(take)),
        'source_duration':raw_duration,'kept_ranges':ranges,'playback_speed':speed,'actual_output_duration':actual,'roles':[{'at':t,'id':i} for t,i in roles],
        'visible_beats':[{**b,'output_at':mapped(b['at'],ranges,speed)} for b in record['beats']],'interactions':clicks}

def validate_clip(path, expected):
    info=probe(path); v=next(s for s in info['streams'] if s['codec_type']=='video')
    assert (v['codec_name'],v['width'],v['height'],v['pix_fmt'],v['r_frame_rate'])==('h264',1920,1080,'yuv420p','30/1')
    assert not any(s['codec_type']=='audio' for s in info['streams'])
    actual=float(info['format']['duration']); assert abs(actual-expected)<.04,(path,actual,expected)
    return actual

def assemble(take, config, manifest):
    position=0
    for scene,edited in zip(config['scenes'],manifest):
        assert scene['number']==edited['number']
        actual=validate_clip(take/edited['edited_clip_path'],scene['duration'])
        edited.update(start=position,end=position+actual)
        position += actual
    assert position<180
    playlist=take/'edited'/'concat-v2.txt'
    playlist.write_text(''.join(f"file 'v2-scene-{s['number']:02}.mp4'\n" for s in manifest),encoding='utf-8')
    final=take/'final'/'classall-demo-v2-silent.mp4'
    pending=final.with_name(final.stem+'.pending.mp4')
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',playlist,'-c','copy','-an','-movflags','+faststart',pending])
    duration=validate_clip(pending,position)
    pending.replace(final)
    report={'version':2,'scenes':manifest,'duration':duration,'final':str(final.relative_to(take)),'audio':'none','sha256':hashlib.sha256(final.read_bytes()).hexdigest()}
    (take/'scene-manifest-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (take/'timing-config-v2.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'V2 silent master: {final} ({duration:.2f}s)')
    return report

def audio_preflight(take, audio, config):
    report=read(take/'scene-manifest-v2.json')
    assert all(s=={key:old[key] for key in s} for s,old in zip(config['scenes'],report['scenes'])), 'Render changed configuration before importing voices'
    issues=[];segments=[]
    for s in report['scenes']:
        voice=Path(audio).resolve()/s['voice_file']; offset=s.get('voice_offset',0)
        if not voice.is_file(): issues.append(f'Missing: {voice}');continue
        info=probe(voice)
        if not any(stream['codec_type']=='audio' for stream in info['streams']): issues.append(f'No audio: {voice}');continue
        duration=float(info['format']['duration'])
        if not math.isfinite(duration) or duration<=0: issues.append(f'Invalid audio duration: {voice}');continue
        available=s['duration']-offset
        if duration>available: issues.append(f'{voice.name}: {duration:.3f}s exceeds available {available:.3f}s by {duration-available:.3f}s')
        segments.append({'file':str(voice),'start':s['start']+offset,'duration':duration,'available':available,'target_duration':s['duration'],'offset':offset})
    (take/'audio-preflight-v2.json').write_text(json.dumps({'issues':issues,'segments':segments},indent=2)+'\n')
    if issues: raise RuntimeError('Voice import stopped before encoding; no speech was cut:\n'+'\n'.join(issues))
    return report,segments

def voice(take,audio,config,check_only=False):
    report,segments=audio_preflight(take,audio,config)
    if check_only:
        print('All nine human recordings fit their assigned slots');return
    master=take/report['final']; validate_clip(master,report['duration'])
    aligned=take/'audio-v2';aligned.mkdir(exist_ok=True)
    for i,segment in enumerate(segments,1):
        target_audio=aligned/f'segment-{i:02}-aligned.wav'
        # Pad each bounded slot separately. Concatenating PCM avoids global
        # mixed-stream EOF/padding behavior and keeps every original pause.
        filters=f"aresample=48000,aformat=channel_layouts=stereo,asetpts=N/SR/TB,adelay={round(segment['offset']*1000)}:all=1,apad=whole_dur={segment['target_duration']}"
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',segment['file'],'-af',filters,'-t',segment['target_duration'],'-c:a','pcm_s16le',target_audio])
        assert abs(float(probe(target_audio)['format']['duration'])-segment['target_duration'])<.001
    playlist=aligned/'concat.txt'
    playlist.write_text(''.join(f"file 'segment-{i:02}-aligned.wav'\n" for i in range(1,len(segments)+1)),encoding='utf-8')
    target=take/'final'/'classall-demo-v2-voiced.mp4'
    pending=target.with_name(target.stem+'.pending.mp4')
    args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',master,'-f','concat','-safe','0','-i',playlist,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',report['duration'],'-movflags','+faststart',pending]
    run(args)
    info=probe(pending)
    assert float(info['format']['duration'])<180
    assert any(s['codec_type']=='audio' for s in info['streams'])
    assert abs(float(info['format']['duration'])-report['duration'])<.1
    pending.replace(target)
    print(f'Human narration assembled: {target}. Original silent master preserved.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('take',type=Path)
    parser.add_argument('--config',type=Path,default=DEFAULT)
    parser.add_argument('--font')
    parser.add_argument('--scene',type=int,choices=range(1,10),help='Re-encode one scene, then assemble using the other existing clips')
    parser.add_argument('--assemble-only',action='store_true')
    parser.add_argument('--audio',type=Path,help='Import human recordings into the existing silent master; no video rerender')
    parser.add_argument('--check-audio',action='store_true',help='Only report missing or overlong recordings')
    args=parser.parse_args(); take=args.take.resolve();config=configuration(args.config)
    if args.check_audio and not args.audio: parser.error('--check-audio requires --audio')
    if args.audio:
        if args.scene or args.assemble_only: parser.error('--audio uses the existing silent master')
        voice(take,args.audio,config,args.check_audio);return
    if args.scene and args.assemble_only: parser.error('Choose --scene or --assemble-only')
    records=read(take/'recording.json')
    assert [r['number'] for r in records]==list(range(1,10)) and all(r['version']==2 for r in records)
    assert read(take/'state-qa.json')['v2_evidence_verified'], 'Run read-only V2 verification first'
    previous=read(take/'scene-manifest-v2.json')['scenes'] if (take/'scene-manifest-v2.json').exists() else None
    if args.assemble_only:
        if not previous: raise RuntimeError('Render all scenes first')
        assert all(s=={key:old[key] for key in s} for s,old in zip(config['scenes'],previous)), 'Render changed configuration first'
        assemble(take,config,previous);return
    if args.scene and not previous: raise RuntimeError('Render all scenes before selecting a single scene')
    font_setup(take,args.font)
    manifest=[]
    for scene,record in zip(config['scenes'],records):
        if args.scene and scene['number']!=args.scene:
            old=previous[scene['number']-1]
            assert scene=={key:old[key] for key in scene}, 'Another scene configuration changed; render it too'
            manifest.append(old)
        else:
            print(f'Rendering V2 scene {scene["number"]}…',flush=True)
            manifest.append(encode_scene(take,scene,record))
    assemble(take,config,manifest)

if __name__=='__main__': main()
