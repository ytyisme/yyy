"""Public metadata validation and bounded same-origin playback requests."""
import io
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import video_service as video


class VideoServiceTests(unittest.TestCase):
    def setUp(self):
        video._cache.clear()
        video._streams.clear()

    def test_only_canonical_public_ids_and_stream_hosts_are_accepted(self):
        for value in ['BV1Q64y1z7se', 'av668580847', 'dy:7540207387488177458', 'ks:3xwn3kkerxj6g9n']:
            self.assertTrue(video.valid_id(value))
        for value in [None, 'https://127.0.0.1/a', '../secret', 'BVfake', 'dy:12']:
            self.assertFalse(video.valid_id(value))
        self.assertTrue(video.trusted_stream('https://upos-test.bilivideo.com/public.mp4'))
        for url in ['https://bilivideo.com.evil.test/a', 'http://upos-test.bilivideo.com/a', 'https://a@upos-test.bilivideo.com/a', 'https://127.0.0.1/a', 'https://upos-test.bilivideo.com:8443/a']:
            self.assertFalse(video.trusted_stream(url))

    def test_author_works_are_owner_filtered_sanitized_and_paginated(self):
        payload = {'list': {'vlist': [
            {'bvid': 'BV1Q64y1z7se', 'mid': 12, 'title': '<em>公开</em>作品', 'author': '作者', 'length': '2:03'},
            {'bvid': 'BV1Qt4y1q79T', 'mid': 13, 'title': '其他作者'}]}, 'page': {'count': 21}, 'is_risk': False}
        with patch.object(video, 'public_json', return_value=payload) as fetch:
            result = video.creator_videos('12', '作者')
        self.assertEqual(result['videos'][0]['title'], '公开作品')
        self.assertEqual(result['videos'][0]['duration'], 123)
        self.assertEqual(len(result['videos']), 1)
        self.assertTrue(result['hasMore'])
        self.assertIn('/x/space/arc/search?', fetch.call_args.args[0])

    def test_playback_is_public_only_and_returns_an_opaque_range_stream(self):
        metadata = {'title': '片名', 'owner': {'name': '作者'}, 'pages': [{'cid': 1, 'part': '第一集', 'duration': 20}, {'cid': 2, 'part': '第二集', 'duration': 30}], 'rights': {'pay': 0}}
        source = {'durl': [{'url': 'https://upos-test.bilivideo.com/public.mp4'}]}
        with patch.object(video, 'public_json', side_effect=[metadata, source]) as fetch:
            result = video.playback('BV1Q64y1z7se', 2)
        self.assertRegex(result['src'], r'^/api/video/stream/[A-Za-z0-9_-]{32}$')
        self.assertNotIn('bilivideo', result['src'])
        self.assertIn('cid=2', fetch.call_args.args[0])
        with patch.object(video, 'public_json', return_value={**metadata, 'rights': {'pay': 1}}):
            with self.assertRaises(video.VideoError) as error:
                video.playback('BV1Qt4y1q79T')
            self.assertEqual(error.exception.status, 403)

    def test_short_video_source_limits_are_explicit_instead_of_showing_a_branded_iframe(self):
        for value in ['dy:7540207387488177458', 'ks:3xwn3kkerxj6g9n']:
            with self.assertRaises(video.VideoError) as error:
                video.playback(value)
            self.assertEqual(error.exception.status, 422)
            self.assertIn('无水印原片', str(error.exception))

    def test_unknown_streams_and_multiple_ranges_do_not_fetch_arbitrary_urls(self):
        class Request:
            headers = {'Range': 'bytes=0-1,3-5'}
            command = 'GET'
        with self.assertRaises(video.VideoError) as error:
            video.stream(Request(), 'missing')
        self.assertEqual(error.exception.status, 410)
        video._streams['token'] = (video.time.monotonic() + 100, 'https://upos-test.bilivideo.com/a.mp4')
        with patch.object(video.urllib.request, 'build_opener') as opener:
            with self.assertRaises(video.VideoError) as error:
                video.stream(Request(), 'token')
            self.assertEqual(error.exception.status, 416)
            opener.assert_not_called()

    def test_platform_pages_are_not_served_as_native_media(self):
        metadata = {'pages': [{'cid': 1, 'part': '片名'}]}
        with patch.object(video, 'public_json', side_effect=[metadata, {'durl': [{'url': 'https://www.bilibili.com/video/BV1Q64y1z7se'}]}]):
            with self.assertRaises(video.VideoError):
                video.playback('BV1Q64y1z7se')


if __name__ == '__main__':
    unittest.main()
