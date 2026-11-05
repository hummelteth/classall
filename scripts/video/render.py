"""Render modular silent H.264 scenes from actual browser videos; no application writes."""
import argparse
import json
import math
import os
import shutil
from pathlib import Path
import subprocess

def run(args, cwd=None):
    subprocess.run([str(a) for a in args],check=True,cwd=cwd)

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],text=True))

def stamp(seconds):
    return f'{int(seconds)//60:02}:{int(seconds)%60:02}'

def render(take, config, audio=None, font=None):
    take = Path(take).resolve()
    font_candidates = [Path(font)] if font else []
    if not font:
        if os.environ.get('WINDIR'): font_candidates.append(Path(os.environ['WINDIR'])/'Fonts'/'arial.ttf')
        font_candidates.extend([Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'), Path('/System/Library/Fonts/Supplemental/Arial.ttf')])
    chosen_font=next((p for p in font_candidates if p.is_file()),None)
    if not chosen_font: raise RuntimeError('Pass --font with a local Unicode TrueType font for scene labels')
    shutil.copyfile(chosen_font,take/'label-font.ttf')
    config = json.loads(Path(config).read_text(encoding='utf-8'))
    (take/'timing-config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    scenes = config['scenes']
    assert [s['number'] for s in scenes]==list(range(1,9)), 'Eight ordered scenes required'
    durations = [float(s['duration']) for s in scenes]
    assert all(math.isfinite(d) and d>0 for d in durations)
    assert sum(durations)<180, 'Submission must be under 180 seconds'
    assert config['width']==1920 and config['height']==1080 and config['fps']==30
    records = json.loads((take/'recording.json').read_text(encoding='utf-8'))
    assert len(records)==8
    assert (take/'state-qa.json').exists(), 'Run persisted-state verification before rendering'
    manifest=[]
    position=0.0
    for scene, record in zip(scenes,records):
        number=scene['number']
        assert number==record['number']
        source=take/'raw'/f'scene-{number:02}.webm'
        target=take/'edited'/f'scene-{number:02}.mp4'
        source_info=probe(source)
        raw_duration=float(source_info['format']['duration'])
        source_video=next(s for s in source_info['streams'] if s['codec_type']=='video')
        input_range='full' if source_video.get('color_range')=='pc' else 'tv'
        # Keep navigation and real changes; omit startup before the first meaningful state.
        cut_in=max(0,record['beats'][0]['at']-0.15) if record['beats'] else 0
        assert cut_in < raw_duration
        duration=float(scene['duration'])
        # Modest retiming plus a result-state hold; never truncate a successful action.
        available=raw_duration-cut_in
        speed=min(1.4,max(0.8,available/duration))
        motion=available/speed
        if motion>duration:
            raise RuntimeError(f'Scene {number} needs {motion:.1f}s; shorten routine capture or increase configured duration')
        title_file=f'scene-title-{number:02}.txt'
        (take/title_file).write_text(scene['title'],encoding='utf-8')
        filters=f'trim=start={cut_in},setpts=(PTS-STARTPTS)/{speed},fps=30,scale=1920:1080:flags=lanczos:in_range={input_range}:out_range=tv:out_color_matrix=bt709,setsar=1,tpad=stop_mode=clone:stop_duration={max(0,duration-motion)+0.1},trim=duration={duration},fade=t=in:st=0:d=0.15,fade=t=out:st={duration-0.15}:d=0.15,drawbox=x=0:y=1000:w=1920:h=80:color=0xf4f0ff@0.96:t=fill:enable=lt(t\\,3),drawtext=fontfile=label-font.ttf:textfile={title_file}:fontsize=28:fontcolor=0x514090:x=64:y=1025:enable=lt(t\\,3),format=yuv420p'
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',source,'-an','-vf',filters,'-c:v','libx264','-preset','fast','-crf','18','-threads','2','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv','-movflags','+faststart',target],cwd=take)
        info=probe(target)
        actual=float(info['format']['duration'])
        assert abs(actual-duration)<0.08
        v=next(s for s in info['streams'] if s['codec_type']=='video')
        assert (v['codec_name'],v['width'],v['height'],v['pix_fmt'])==('h264',1920,1080,'yuv420p')
        assert not any(s['codec_type']=='audio' for s in info['streams'])
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(duration/2),'-i',target,'-frames:v','1',take/'frames'/f'edited-{number:02}.png'])
        manifest.append({**scene,'target_duration':duration,'actual_output_duration':actual,'source_recording_path':str(source.relative_to(take)),'edited_clip_path':str(target.relative_to(take)),'start':position,'end':position+actual,'source_duration':raw_duration,'cut_in':cut_in,'playback_speed':speed,'visible_beats':record['beats']})
        position+=actual
    # Relative generated names avoid OS-specific concat path quoting.
    playlist=take/'edited'/'concat.txt'
    playlist.write_text(''.join(f"file 'scene-{i:02}.mp4'\n" for i in range(1,9)),encoding='utf-8')
    final=take/'final'/'classall-demo-silent.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',playlist,'-c','copy','-an','-movflags','+faststart',final])
    info=probe(final)
    assert float(info['format']['duration'])<180
    assert abs(float(info['format']['duration'])-sum(durations))<0.1
    (take/'scene-manifest.json').write_text(json.dumps({'scenes':manifest,'final':str(final.relative_to(take)),'duration':float(info['format']['duration']),'video':info['streams'][0],'audio':'none'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    worksheet=['# Hoja de preparación de voz — ClassAll','', 'Primer montaje sin audio. No es un guion definitivo. Todo el escenario es sintético.','', '| Escena | Inicio–fin | Visible | Mensaje principal | Tiempo para hablar | Transición |','|---|---|---|---|---|---|']
    for s in manifest:
        visible='; '.join(' '.join(b['note'].replace('|','/').split()) for b in s['visible_beats'])
        worksheet.append(f"| {s['number']:02} · {s['title']} | {stamp(s['start'])}–{stamp(s['end'])} | {visible} | {s['purpose']} | {max(0,s['actual_output_duration']-1):.0f} s | {s['transition']} |")
    (take/'narration-worksheet-es.md').write_text('\n'.join(worksheet)+'\n',encoding='utf-8')
    if audio:
        # Optional later phase: one team-recorded file per scene; never silently trim speech.
        for scene in manifest:
            i=scene['number']
            voice=Path(audio)/f'scene-{i:02}.wav'
            assert voice.exists(), f'Missing team recording: {voice}'
            assert float(probe(voice)['format']['duration'])<=scene['actual_output_duration'], f'Voice exceeds scene {i}; adjust timing config'
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',take/scene['edited_clip_path'],'-i',voice,'-c:v','copy','-c:a','aac','-af','apad','-t',str(scene['actual_output_duration']),'-movflags','+faststart',take/'edited'/f'voiced-{i:02}.mp4'])
        playlist.write_text(''.join(f"file 'voiced-{i:02}.mp4'\n" for i in range(1,9)),encoding='utf-8')
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',playlist,'-c','copy','-movflags','+faststart',take/'final'/'classall-demo-voiced.mp4'])
    print(f'Rendered {final}: {position:.2f}s, H.264, 1920×1080, no audio')

def assemble_existing(take):
    """Assemble already edited clips without requiring browser services or raw videos."""
    take=Path(take).resolve()
    manifest=json.loads((take/'scene-manifest.json').read_text(encoding='utf-8'))
    assert [s['number'] for s in manifest['scenes']]==list(range(1,9))
    total=0
    for scene in manifest['scenes']:
        info=probe(take/'edited'/f"scene-{scene['number']:02}.mp4")
        video=next(s for s in info['streams'] if s['codec_type']=='video')
        assert (video['codec_name'],video['width'],video['height'],video['pix_fmt'],video['r_frame_rate'])==('h264',1920,1080,'yuv420p','30/1')
        assert not any(s['codec_type']=='audio' for s in info['streams'])
        duration=float(info['format']['duration'])
        assert abs(duration-scene['actual_output_duration'])<0.08, 'Re-render and regenerate the manifest after timing changes'
        total+=duration
    assert total<180
    playlist=take/'edited'/'concat.txt'
    playlist.write_text(''.join(f"file 'scene-{i:02}.mp4'\n" for i in range(1,9)),encoding='utf-8')
    final=take/'final'/'classall-demo-silent.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',playlist,'-c','copy','-an','-movflags','+faststart',final])
    assert abs(float(probe(final)['format']['duration'])-total)<0.1
    print(f'Assembled existing edited clips: {final} ({total:.2f}s)')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('take')
    parser.add_argument('--config',default=str(Path(__file__).with_name('scenes.json')))
    parser.add_argument('--audio',help='Later phase only: directory of team-recorded scene-01.wav … scene-08.wav')
    parser.add_argument('--font',help='Local Unicode TrueType font for short scene labels')
    parser.add_argument('--assemble-only',action='store_true',help='Assemble existing edited clips using their measured manifest')
    args=parser.parse_args()
    if args.assemble_only:
        if args.audio: parser.error('--audio requires a full render')
        assemble_existing(args.take)
    else:
        render(args.take,args.config,args.audio,args.font)
