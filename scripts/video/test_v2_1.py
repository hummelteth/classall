"""V2.1 safety checks; run without browser or production recordings."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import render_v2 as v2
import render_v2_1 as edit
from band_v2_1 import PALETTE, persona_timeline

class RefinementSafety(unittest.TestCase):
    def test_approved_timing_and_voice_files_are_preserved(self):
        original = v2.configuration(v2.DEFAULT)
        updated = edit.configuration(edit.DEFAULT)
        self.assertEqual(sum(s['duration'] for s in updated['scenes']), 179)
        for before, after in zip(original['scenes'], updated['scenes']):
            for key in ('duration', 'speaker', 'voice_offset', 'voice_file'):
                self.assertEqual(before[key], after[key])
        self.assertEqual(updated['scenes'][0]['message'], 'Cada estudiante tiene algo que aprender y algo que aportar.')

    def test_role_switches_follow_cut_mapping_not_speaker(self):
        record = {'events': [{'type':'persona', 'id':i, 'at':t} for t,i in [(0,2),(4,1),(8,2)]]}
        roles = persona_timeline(record, [(0,3),(5,10)], 1, 23, edit.mapped)
        self.assertEqual(roles, [(0,2),(3.0,1),(6.0,2)])
        with self.assertRaisesRegex(ValueError, 'refusing to guess'):
            persona_timeline({'events':[]}, [(0,3)], 1, 3, edit.mapped)

    def test_palette_text_contrast(self):
        def linear(x):
            x = x/255
            return x/12.92 if x <= .04045 else ((x+.055)/1.055)**2.4
        for *_, color in PALETTE.values():
            rgb = [int(color[i:i+2],16) for i in (1,3,5)]
            luminance = sum(w*linear(v) for w,v in zip((.2126,.7152,.0722),rgb))
            self.assertGreaterEqual(1.05/(luminance+.05), 4.5)

    def test_failed_assembly_preserves_both_masters(self):
        config = edit.configuration(edit.DEFAULT)
        with tempfile.TemporaryDirectory() as directory:
            take=Path(directory); (take/'edited').mkdir(); (take/'final').mkdir()
            original=take/'final/classall-demo-v2-silent.mp4'
            updated=take/'final/classall-demo-v2-1-silent.mp4'
            for path in (original,updated): path.write_bytes(b'preserved')
            scenes=[{**s,'edited_clip_path':f"edited/v2-1-scene-{s['number']:02}.mp4"} for s in config['scenes']]
            def validate(path, expected):
                if '.pending.' in path.name: raise RuntimeError('validation failed')
                return expected
            with patch.object(edit,'validate_clip',side_effect=validate), patch.object(edit,'run'):
                with self.assertRaises(RuntimeError): edit.assemble(take,config,scenes)
            for path in (original,updated): self.assertEqual(path.read_bytes(),b'preserved')

    def test_audio_errors_are_isolated_from_v2(self):
        config=edit.configuration(edit.DEFAULT)
        with tempfile.TemporaryDirectory() as directory:
            take=Path(directory); audio=take/'voices'; audio.mkdir()
            (take/'scene-manifest-v2-1.json').write_text(json.dumps({'scenes':config['scenes']}))
            (take/'audio-preflight-v2.json').write_text('original')
            with self.assertRaisesRegex(RuntimeError,'no speech was cut'):
                edit.audio_preflight(take,audio,config)
            self.assertEqual((take/'audio-preflight-v2.json').read_text(),'original')
            self.assertEqual(len(edit.read(take/'audio-preflight-v2-1.json')['issues']),9)

    def test_overlong_voice_is_rejected_before_encoding(self):
        config=edit.configuration(edit.DEFAULT)
        with tempfile.TemporaryDirectory() as directory:
            take=Path(directory); audio=take/'voices'; audio.mkdir()
            scenes=[{**s,'start':sum(x['duration'] for x in config['scenes'][:i])} for i,s in enumerate(config['scenes'])]
            (take/'scene-manifest-v2-1.json').write_text(json.dumps({'scenes':scenes}))
            (audio/config['scenes'][0]['voice_file']).touch()
            with patch.object(edit,'probe',return_value={'streams':[{'codec_type':'audio'}],'format':{'duration':'30'}}):
                with self.assertRaisesRegex(RuntimeError,'exceeds available'):
                    edit.audio_preflight(take,audio,config)

if __name__ == '__main__': unittest.main()
