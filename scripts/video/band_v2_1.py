"""ClassAll V2.1 editorial band. Coordinates refer to the final 1080p film."""
from pathlib import Path
import subprocess

PALETTE = {
    0: ('CLASSALL', '', '', '#6550B5'),
    1: ('LAURA MARTÍN', 'ESTUDIANTE', 'Necesita apoyo', '#355F87'),
    2: ('DAVID CHEN', 'ESTUDIANTE / TUTOR', 'Comparte conocimientos', '#29685C'),
    3: ('ELENA GARCÍA', 'PROFESORA', 'Orienta el apoyo', '#87621F'),
}

def check_ffmpeg():
    """Probe capabilities instead of guessing from a platform/version string."""
    filters = subprocess.check_output(['ffmpeg', '-hide_banner', '-filters'], text=True, stderr=subprocess.STDOUT)
    encoders = subprocess.check_output(['ffmpeg', '-hide_banner', '-encoders'], text=True, stderr=subprocess.STDOUT)
    for name in ('drawtext', 'drawbox', 'scale', 'pad', 'concat', 'tpad', 'fade'):
        if name not in filters:
            raise RuntimeError(f'FFmpeg is missing {name}; install a full FFmpeg build. See VIDEO_V2_1_QA_REPORT.md')
    if 'libx264' not in encoders:
        raise RuntimeError('FFmpeg is missing libx264')

def persona_timeline(record, ranges, speed, duration, mapped):
    events = [e for e in record['events'] if e['type'] == 'persona']
    if not events:
        raise ValueError('Missing recorded persona events; refusing to guess the active interface')
    roles = []
    for event in events:
        identity = event['id']
        if identity not in PALETTE:
            raise ValueError(f'Unknown recorded persona: {identity}')
        at = min(duration, mapped(event['at'], ranges, speed))
        if roles and abs(at-roles[-1][0]) < .001:
            roles[-1] = (at, identity)
        elif not roles or roles[-1][1] != identity:
            roles.append((at, identity))
    roles[0] = (0, roles[0][1])
    return roles

def band_filters(take, scene, roles):
    n = scene['number']
    overlays = ['drawbox=x=0:y=954:w=1920:h=126:color=0xfaf9f6:t=fill']
    def text(name, value, size, color, x, y, enable=None, alpha=None):
        filename = f'v2-1-{n}-{name}.txt'
        (Path(take)/filename).write_text(value, encoding='utf-8')
        result = f'drawtext=fontfile=v2-1-font.ttf:textfile={filename}:expansion=none:fontsize={size}:fontcolor={color}:x={x}:y={y}'
        if enable: result += f":enable='{enable}'"
        if alpha: result += f":alpha='{alpha}'"
        overlays.append(result)
    for i, (start, identity) in enumerate(roles):
        end = roles[i+1][0] if i+1 < len(roles) else scene['duration']
        if end <= start: continue
        name, role, concept, color = PALETTE[identity]
        enable = f'gte(t,{start})*lt(t,{end})'
        color = '0x'+color[1:]
        overlays.extend([
            f"drawbox=x=0:y=954:w=1920:h=5:color={color}:t=fill:enable='{enable}'",
            f"drawbox=x=40:y=969:w=472:h=98:color={color}:t=fill:enable='{enable}'",
        ])
        alpha = f'min(1,(t-{start})/0.18)' if start > 0 else None
        text(f'name-{i}', name, 28 if identity else 34, 'white', 62, 975 if identity else 999, enable, alpha)
        if role:
            text(f'role-{i}', role, 20, 'white', 62, 1009, enable, alpha)
            text(f'concept-{i}', concept, 18, 'white', 62, 1040, enable, alpha)
    text('message', scene['message'], 34 if n == 1 else 32, '0x2d3330', 552, 982)
    text('pillar', scene.get('detail', ''), 20, '0x6550b5', 554, 1035)
    return overlays
