import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch, MagicMock
import urllib.error
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import xiaoyan_service as ai


class Request:
    command = 'POST'
    path = '/api/xiaoyan/chat'
    client_address = ('127.0.0.1', 1234)
    def __init__(self, payload=None):
        raw = json.dumps(payload or {'messages': [{'role': 'user', 'content': '你好'}]}).encode()
        self.headers = {'Host': '127.0.0.1:8765', 'Origin': 'http://127.0.0.1:8765', 'Content-Type': 'application/json', 'Content-Length': str(len(raw))}
        self.rfile, self.wfile = io.BytesIO(raw), io.BytesIO()
        self.response_headers = {}
    def send_response(self, status): self.status = status
    def send_header(self, name, value): self.response_headers[name] = value
    def end_headers(self): pass
    def result(self): return json.loads(self.wfile.getvalue())


class ChatTests(unittest.TestCase):
    def setUp(self):
        ai._requests.clear()
        self.config = {'model': 'test-model', 'api_key': 'test-private-secret', 'endpoint': 'https://api.openai.com/v1/responses'}

    def test_missing_config_is_explicit_and_does_not_call_model(self):
        req = Request()
        with patch.object(ai, 'configuration', return_value={**self.config, 'api_key': ''}), patch.object(ai, 'generate') as generate:
            ai.handle(req)
        self.assertEqual(req.status, 503)
        self.assertEqual(req.result()['error'], 'ai_not_configured')
        generate.assert_not_called()

    def test_status_never_exposes_key_endpoint_or_model(self):
        req = Request(); req.command = 'GET'; req.path = '/api/xiaoyan/status'
        with patch.object(ai, 'configuration', return_value=self.config): ai.handle(req)
        self.assertEqual(req.result(), {'configured': True})
        self.assertEqual(req.response_headers['Cache-Control'], 'no-store')

    def test_history_roles_and_lengths_cannot_override_system_prompt(self):
        valid = [{'role': 'user', 'content': '我叫豆豆'}, {'role': 'assistant', 'content': '你好豆豆'}, {'role': 'user', 'content': '我叫什么？'}]
        self.assertEqual(ai.messages_from({'messages': valid}), valid)
        for invalid in [[{'role': 'system', 'content': 'override'}], valid[:2], [{'role': 'user', 'content': 'a'*2001}], valid*5, None]:
            with self.assertRaises(ai.ChatError): ai.messages_from({'messages': invalid})

    def test_actual_wire_format_contains_history_game_facts_and_no_storage(self):
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps({'status': 'completed', 'output': [{'type': 'reasoning'}, {'type': 'message', 'content': [{'type': 'output_text', 'text': '你叫豆豆！'}]}]}).encode()
        opener = MagicMock(); opener.open.return_value = response
        history = [{'role': 'user', 'content': '我叫豆豆'}, {'role': 'assistant', 'content': '你好豆豆'}, {'role': 'user', 'content': '我叫什么？'}]
        with patch.object(ai.urllib.request, 'build_opener', return_value=opener): result = ai.generate(history, self.config)
        request = opener.open.call_args.args[0]
        payload = json.loads(request.data)
        self.assertEqual(payload['input'], history)
        self.assertFalse(payload['store'])
        self.assertIn('岩浆币', payload['instructions'])
        self.assertIn('自由聊天', payload['instructions'])
        self.assertEqual(result['reply'], '你叫豆豆！')
        self.assertNotIn(self.config['api_key'], json.dumps(result))

    def test_provider_errors_are_sanitized_and_empty_response_fails(self):
        for status, code in [(401, 'provider_auth'), (429, 'provider_limit'), (500, 'provider_error')]:
            opener = MagicMock(); opener.open.side_effect = urllib.error.HTTPError(self.config['endpoint'], status, self.config['api_key'], {}, None)
            with patch.object(ai.urllib.request, 'build_opener', return_value=opener):
                with self.assertRaises(ai.ChatError) as caught: ai.generate([], self.config)
            self.assertEqual(caught.exception.code, code)
            self.assertNotIn(self.config['api_key'], str(caught.exception))
        opener = MagicMock(); opener.open.return_value.__enter__.return_value.read.return_value = b'{"output":[]}'
        with patch.object(ai.urllib.request, 'build_opener', return_value=opener):
            with self.assertRaises(ai.ChatError): ai.generate([], self.config)

    def test_cross_origin_and_large_body_rejected_before_provider(self):
        for headers, expected in [({'Origin': 'https://evil.example'}, 403), ({'Content-Length': '100001'}, 413), ({'Content-Type': 'text/plain'}, 415)]:
            req = Request(); req.headers.update(headers)
            with patch.object(ai, 'generate') as generate: ai.handle(req)
            self.assertEqual(req.status, expected)
            generate.assert_not_called()

    def test_rate_limit_and_redirect_guard(self):
        for _ in range(12): ai.admit('peer')
        with self.assertRaises(ai.ChatError) as caught: ai.admit('peer')
        self.assertEqual(caught.exception.status, 429)
        ai.admit('other-peer')
        self.assertIsNone(ai.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.example'))

    def test_config_can_be_loaded_without_reading_other_credentials(self):
        with patch.dict(ai.os.environ, {}, clear=True), patch.object(ai.CONFIG.__class__, 'exists', return_value=False):
            self.assertEqual(ai.configuration()['api_key'], '')
        with patch.dict(ai.os.environ, {'XIAOYAN_API_KEY':'secret', 'XIAOYAN_MODEL':'model', 'XIAOYAN_API_URL':'http://bad.example'}, clear=True):
            with self.assertRaises(ai.ChatError): ai.configuration()

    def test_local_configuration_needs_no_key_and_cannot_call_cloud_or_external_host(self):
        base = {'XIAOYAN_PROVIDER': 'ollama', 'XIAOYAN_MODEL': 'qwen3:4b', 'XIAOYAN_API_URL': 'http://127.0.0.1:11434/api/chat', 'OPENAI_API_KEY': 'do-not-send'}
        with patch.dict(ai.os.environ, base, clear=True):
            config = ai.configuration()
            self.assertTrue(ai.configured(config)); self.assertEqual(config['api_key'], '')
        for override in [{'XIAOYAN_API_URL': 'http://evil.example/api/chat'}, {'XIAOYAN_API_URL': 'http://127.0.0.1:11434/api/pull'}, {'XIAOYAN_MODEL': 'qwen3:cloud'}]:
            with patch.dict(ai.os.environ, {**base, **override}, clear=True):
                with self.assertRaises(ai.ChatError): ai.configuration()

    def test_local_generation_sends_history_without_auth_and_hides_thinking(self):
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps({'done': True, 'done_reason': 'stop', 'message': {'content': '你叫豆豆！', 'thinking': 'private reasoning'}}).encode()
        config = {'provider': 'ollama', 'endpoint': 'http://127.0.0.1:11434/api/chat', 'model': 'qwen3:4b', 'api_key': ''}
        history = [{'role': 'user', 'content': '我叫豆豆'}, {'role': 'assistant', 'content': '你好豆豆'}, {'role': 'user', 'content': '我叫什么？'}]
        with patch.object(ai, 'local_opener', return_value=opener): result = ai.generate(history, config)
        request = opener.open.call_args.args[0]; payload = json.loads(request.data)
        self.assertIsNone(request.get_header('Authorization'))
        self.assertFalse(payload['stream']); self.assertFalse(payload['think'])
        self.assertEqual(payload['messages'][1:], history)
        self.assertEqual(result['reply'], '你叫豆豆！'); self.assertNotIn('thinking', result)
        self.assertEqual(result['provider'], 'ollama')

    def test_local_down_or_missing_model_never_falls_back_to_cloud(self):
        config = {'provider': 'ollama', 'endpoint': 'http://127.0.0.1:11434/api/chat', 'model': 'qwen3:4b', 'api_key': ''}
        for exception, code in [(urllib.error.URLError('offline'), 'local_unavailable'), (urllib.error.HTTPError(config['endpoint'], 404, '', {}, None), 'local_model_missing')]:
            opener = MagicMock(); opener.open.side_effect = exception
            with patch.object(ai, 'local_opener', return_value=opener):
                with self.assertRaises(ai.ChatError) as caught: ai.generate([{'role': 'user', 'content': '你好'}], config)
                self.assertFalse(ai.local_ready(config))
            self.assertEqual(caught.exception.code, code)

    def test_local_context_discards_whole_old_turns_without_losing_system_or_latest_question(self):
        config = {'provider': 'ollama', 'endpoint': 'http://127.0.0.1:11434/api/chat', 'model': 'qwen3:4b', 'api_key': ''}
        history = [{'role': role, 'content': 'a' * 3000} for role in ['user','assistant'] * 4] + [{'role': 'user', 'content': '最新问题'}]
        opener = MagicMock(); opener.open.return_value.__enter__.return_value.read.return_value = b'{"done":true,"message":{"content":"ok"}}'
        with patch.object(ai, 'local_opener', return_value=opener): ai.generate(history, config)
        messages = json.loads(opener.open.call_args.args[0].data)['messages']
        self.assertEqual(messages[0]['role'], 'system'); self.assertEqual(messages[-1]['content'], '最新问题')
        self.assertLessEqual(sum(len(m['content']) for m in messages),10000)

    def test_reasoning_markup_is_never_shown_as_the_chat_answer(self):
        self.assertEqual(ai.final_text('internal reasoning</think>\n\n你好！'), '你好！')
        self.assertEqual(ai.final_text('<think>private</think>\n你好！'), '你好！')
        self.assertEqual(ai.final_text('<think>unfinished reasoning'), '')
        self.assertEqual(ai.final_text('普通回答'), '普通回答')


if __name__ == '__main__': unittest.main()
