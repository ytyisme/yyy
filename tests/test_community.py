"""Exercise persistent community storage and the actual HTTP/media API."""
import http.client
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import community_store as community
spec = importlib.util.spec_from_file_location('game_test_server', ROOT / 'server.py')
game = importlib.util.module_from_spec(spec)
old_argv = sys.argv
sys.argv = ['server.py']
spec.loader.exec_module(game)
sys.argv = old_argv


def scene():
    return [{'id': 'block-one', 'type': 'brick', 'x': 0, 'z': 4, 'y': 0, 'w': 3, 'h': 1.5, 'l': 2, 'rotation': 0}]


class CommunityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.store = community.CommunityStore(self.directory.name)
        self.owner = self.store.owner('a' * 64)

    def test_map_upload_updates_one_automatic_post_and_survives_restart(self):
        payload = {'id': 'world-test', 'name': '轨道公园', 'author': '小玩家', 'scene': scene()}
        self.store.save_map(self.owner, payload)
        payload['scene'][0]['w'] = 29
        self.store.save_map(self.owner, payload)
        restarted = community.CommunityStore(self.directory.name)
        self.assertEqual(restarted.map('world-test')['scene'][0]['w'], 29)
        feed = restarted.feed()['posts']
        self.assertEqual(len(feed), 1)
        self.assertEqual(feed[0]['title'], '快来和我一起玩吧')
        self.assertEqual(feed[0]['map']['name'], '轨道公园')
        with self.assertRaises(community.APIError):
            restarted.save_map(restarted.owner('b' * 64), payload)

    def test_media_and_posts_are_shared_idempotent_and_owner_checked(self):
        media = self.store.upload(self.owner, 'image/gif', b'GIF89a' + bytes(32))
        value = {'clientId': 'message-once', 'title': '今天的生活', 'text': '一起玩吧 😂', 'category': '生活', 'media': [media['id']]}
        first = self.store.post(self.owner, value)
        self.assertEqual(first, self.store.post(self.owner, value))
        post = self.store.feed()['posts'][0]
        self.assertEqual(post['media'][0]['kind'], 'image')
        self.assertEqual(post['text'], value['text'])
        with self.assertRaises(community.APIError):
            self.store.post(self.store.owner('b' * 64), {**value, 'clientId': 'steal-media'})
        with self.assertRaises(community.APIError):
            self.store.upload(self.owner, 'image/png', b'<script>alert(1)</script>')

    def test_delayed_old_upload_cannot_replace_a_newer_map(self):
        value = {'id': 'world-latest', 'scene': scene(), 'modifiedAt': 2000}
        self.store.save_map(self.owner, value)
        with self.assertRaises(community.APIError) as caught:
            self.store.save_map(self.owner, {**value, 'modifiedAt': 1000, 'scene': []})
        self.assertEqual(caught.exception.status, 409)
        self.assertEqual(len(self.store.map('world-latest')['scene']), 1)

    def test_feed_pagination_does_not_skip_posts_with_matching_timestamps(self):
        for i in range(65):
            self.store.post(self.owner, {'clientId': f'message-{i}', 'text': str(i)})
        cursor, ids = '', []
        while True:
            page = self.store.feed(cursor)
            ids += [p['id'] for p in page['posts']]
            cursor = page['next']
            if not cursor:
                break
        self.assertEqual(len(ids), 65)
        self.assertEqual(len(set(ids)), 65)

    def test_every_track_shape_and_vehicle_is_preserved(self):
        values = []
        for i, shape in enumerate(community.SHAPES):
            values.append({**scene()[0], 'id': f'track-{i}', 'type': 'track', 'shape': shape, 'tunnel': True})
        values += [{**scene()[0], 'id': 'train-one', 'type': 'coaster', 'trackId': 'track-0', 'trainId': 'train-one', 'running': True}]
        self.store.save_map(self.owner, {'id': 'world-tracks', 'scene': values})
        saved = self.store.map('world-tracks')['scene']
        self.assertEqual({p['shape'] for p in saved[:-1]}, community.SHAPES)
        self.assertFalse(saved[-1]['running'])


class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        community._store = community.CommunityStore(self.directory.name)
        class QuietHandler(game.Handler):
            def log_message(self, *args):
                pass
        self.server = game.ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop)

    def stop(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(2)

    def request(self, method, path, data=None, headers=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.port, timeout=5)
        h = {'X-Community-Key': 'a' * 64, **(headers or {})}
        if isinstance(data, dict):
            data = json.dumps(data).encode(); h['Content-Type'] = 'application/json'
        conn.request(method, '/api/community/' + path, body=data, headers=h)
        response = conn.getresponse(); status, body, result_headers = response.status, response.read(), dict(response.getheaders()); conn.close()
        return status, body, result_headers

    def test_two_clients_upload_open_maps_and_play_video_ranges(self):
        status, body, _ = self.request('POST', 'maps', {'id': 'world-http', 'name': '共享公园', 'scene': scene()})
        self.assertEqual(status, 200, body)
        status, body, _ = self.request('GET', 'feed', headers={'X-Community-Key': 'b' * 64})
        self.assertEqual(json.loads(body)['posts'][0]['title'], '快来和我一起玩吧')
        self.assertEqual(self.request('GET', 'maps/world-http')[0], 200)
        video = b'\x00\x00\x00\x18ftypisom' + bytes(200)
        status, body, _ = self.request('POST', 'media', video, {'Content-Type': 'video/mp4'})
        self.assertEqual(status, 200, body)
        media_id = json.loads(body)['id']
        status, body, headers = self.request('GET', 'media/' + media_id, headers={'Range': 'bytes=4-11'})
        self.assertEqual(status, 206); self.assertEqual(body, video[4:12]); self.assertIn('Content-Range', headers)
        self.assertEqual(self.request('HEAD', 'media/' + media_id)[1], b'')
        self.assertEqual(self.request('GET', 'media/' + media_id, headers={'Range': 'bytes=9999-'})[0], 416)
        self.assertEqual(self.request('POST', 'posts', {'clientId': 'hello-one', 'text': '你好'}, {'Origin': 'https://wrong.invalid'})[0], 403)
        self.assertEqual(self.request('POST', 'posts', {'clientId': 'hello-two', 'text': '你好'}, {'X-Community-Key': ''})[0], 401)
        self.assertEqual(self.request('GET', 'media/../../.env')[0], 404)


if __name__ == '__main__':
    unittest.main()
