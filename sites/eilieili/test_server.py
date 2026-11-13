import importlib.util
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

class VideoSiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory()
        os.environ['EILIEILI_DATA'] = cls.directory.name
        spec = importlib.util.spec_from_file_location('eilieili_server', Path(__file__).with_name('server.py'))
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        cls.server = module.ThreadingHTTPServer(('127.0.0.1',0), module.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True); cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(); cls.directory.cleanup()

    def test_upload_list_and_stream(self):
        data = b'\x1a\x45\xdf\xa3' + b'example-video-data'
        request = Request(self.base+'/api/videos?title=hello&author=creator&category=%E7%94%9F%E6%B4%BB', data=data, headers={'Content-Type':'video/webm'})
        with urlopen(request) as response: video_id = json.load(response)['id']
        with urlopen(self.base+'/api/videos') as response: videos = json.load(response)['videos']
        self.assertEqual(videos[0]['title'], 'hello'); self.assertEqual(videos[0]['id'], video_id)
        with urlopen(Request(self.base+'/media/'+video_id, headers={'Range':'bytes=4-10'})) as response:
            self.assertEqual(response.status,206); self.assertEqual(response.read(),data[4:11])
        with urlopen(Request(self.base+'/media/'+video_id, headers={'Range':'bytes=-4'})) as response: self.assertEqual(response.read(),data[-4:])

    def test_reject_invalid_video_and_private_paths(self):
        request = Request(self.base+'/api/videos?title=x&author=y&category=%E7%94%9F%E6%B4%BB',data=b'not a video',headers={'Content-Type':'video/mp4'})
        with self.assertRaises(HTTPError) as error: urlopen(request)
        self.assertEqual(error.exception.code,400)
        with self.assertRaises(HTTPError) as error: urlopen(self.base+'/.data/videos.sqlite3')
        self.assertEqual(error.exception.code,404)

if __name__ == '__main__': unittest.main()
