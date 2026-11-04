"""Editorial safety regressions, independent of browser services and media files."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import render_v2 as edit


class EditorialSafety(unittest.TestCase):
    def test_action_before_first_outcome_is_preserved_and_mapped(self):
        record={'beats':[{'at':8,'duration':3}], 'events':[{'type':'important','at':2}]}
        ranges=edit.keep_ranges(record,12)
        self.assertTrue(any(start<2<end for start,end in ranges))
        self.assertTrue(any(start<8 and end>=11 for start,end in ranges))
        self.assertAlmostEqual(edit.mapped(5,ranges,1),ranges[0][1]-ranges[0][0])
        self.assertAlmostEqual(edit.mapped(9,ranges,1),sum(b-a for a,b in ranges[:1])+9-ranges[1][0])

    def test_hard_ceiling_rejects_exactly_three_minutes(self):
        config=edit.read(edit.DEFAULT)
        config['scenes'][-1]['duration']+=1
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'config.json';path.write_text(json.dumps(config))
            with self.assertRaisesRegex(AssertionError,'strictly below'):
                edit.configuration(path)

    def test_failed_reassembly_preserves_previous_valid_master(self):
        config=edit.configuration(edit.DEFAULT)
        with tempfile.TemporaryDirectory() as directory:
            take=Path(directory);(take/'edited').mkdir();(take/'final').mkdir()
            master=take/'final'/'classall-demo-v2-silent.mp4';master.write_bytes(b'previous valid master')
            scenes=[{**s,'edited_clip_path':f"edited/v2-scene-{s['number']:02}.mp4"} for s in config['scenes']]
            def validate(path,expected):
                if '.pending.' in path.name: raise RuntimeError('New encoding failed validation')
                return expected
            def encode(args): Path(args[-1]).write_bytes(b'incomplete new master')
            with patch.object(edit,'validate_clip',side_effect=validate), patch.object(edit,'run',side_effect=encode):
                with self.assertRaisesRegex(RuntimeError,'failed validation'):
                    edit.assemble(take,config,scenes)
            self.assertEqual(master.read_bytes(),b'previous valid master')

    def test_voice_preflight_reports_missing_and_overrun_without_cutting_master(self):
        config=edit.configuration(edit.DEFAULT)
        with tempfile.TemporaryDirectory() as directory:
            take=Path(directory);audio=take/'voices';audio.mkdir()
            scenes=[];position=0
            for s in config['scenes']:
                scenes.append({**s,'start':position});position+=s['duration']
            (take/'scene-manifest-v2.json').write_text(json.dumps({'scenes':scenes}))
            master=take/'sentinel-silent.mp4';master.write_bytes(b'preserved original')
            (audio/scenes[0]['voice_file']).touch()
            with patch.object(edit,'probe',return_value={'streams':[{'codec_type':'audio'}],'format':{'duration':'30'}}):
                with self.assertRaisesRegex(RuntimeError,'no speech was cut'):
                    edit.audio_preflight(take,audio,config)
            report=edit.read(take/'audio-preflight-v2.json')
            self.assertEqual(len(report['issues']),9)
            self.assertIn('exceeds available',report['issues'][0])
            self.assertEqual(master.read_bytes(),b'preserved original')


if __name__=='__main__': unittest.main()
