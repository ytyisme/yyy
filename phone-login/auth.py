"""Owner-only phone authentication. No demo codes or network calls on import."""
from dataclasses import dataclass
from pathlib import Path
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import urllib.request

CODE_TTL = 300
SESSION_TTL = 7 * 24 * 3600
COOKIE = "lava_phone_session"


def normalize_phone(value):
    phone = re.sub(r"[\s()-]", "", str(value or ""))
    if phone.startswith("+86"):
        phone = phone[3:]
    if not re.fullmatch(r"1[3-9]\d{9}", phone):
        raise AuthError("请输入正确的 11 位手机号", 400)
    return "+86" + phone


class AuthError(Exception):
    def __init__(self, message, status=400, retry_after=0):
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after


@dataclass(frozen=True)
class SmsConfig:
    owner_phone: str = ""
    secret_id: str = ""
    secret_key: str = ""
    app_id: str = ""
    sign_name: str = ""
    template_id: str = ""
    region: str = "ap-guangzhou"

    @classmethod
    def from_env(cls):
        return cls(*(os.environ.get(key, "") for key in (
            "GAME_OWNER_PHONE", "TENCENTCLOUD_SECRET_ID", "TENCENTCLOUD_SECRET_KEY",
            "GAME_SMS_APP_ID", "GAME_SMS_SIGN_NAME", "GAME_SMS_TEMPLATE_ID"
        )), region=os.environ.get("GAME_SMS_REGION", "ap-guangzhou"))

    @property
    def ready(self):
        if not all((self.owner_phone, self.secret_id, self.secret_key,
                    self.app_id, self.sign_name, self.template_id)):
            return False
        try:
            normalize_phone(self.owner_phone)
        except AuthError:
            return False
        return True


def signed_sms_request(config, phone, code, timestamp=None):
    """Tencent Cloud API 3.0 TC3 signature; credentials stay server-side."""
    timestamp = int(time.time() if timestamp is None else timestamp)
    host = "sms.tencentcloudapi.com"
    payload = json.dumps({
        "PhoneNumberSet": [phone], "SmsSdkAppId": config.app_id,
        "SignName": config.sign_name, "TemplateId": config.template_id,
        "TemplateParamSet": [code, str(CODE_TTL // 60)],
    }, ensure_ascii=False, separators=(",", ":")).encode()
    sha = lambda value: hashlib.sha256(value).hexdigest()
    sign = lambda key, value: hmac.new(key, value.encode(), hashlib.sha256).digest()
    content_type = "application/json; charset=utf-8"
    canonical = "POST\n/\n\ncontent-type:" + content_type + "\nhost:" + host + "\n\ncontent-type;host\n" + sha(payload)
    date = time.strftime("%Y-%m-%d", time.gmtime(timestamp))
    scope = date + "/sms/tc3_request"
    to_sign = "TC3-HMAC-SHA256\n" + str(timestamp) + "\n" + scope + "\n" + sha(canonical.encode())
    date_key = sign(("TC3" + config.secret_key).encode(), date)
    signing_key = sign(sign(date_key, "sms"), "tc3_request")
    signature = sign(signing_key, to_sign).hex()
    return urllib.request.Request("https://" + host + "/", data=payload, headers={
        "Content-Type": content_type,
        "Authorization": "TC3-HMAC-SHA256 Credential=" + config.secret_id + "/" + scope + ", SignedHeaders=content-type;host, Signature=" + signature,
        "X-TC-Action": "SendSms", "X-TC-Version": "2021-01-11",
        "X-TC-Timestamp": str(timestamp), "X-TC-Region": config.region,
    }, method="POST")


def send_tencent_sms(config, phone, code):
    try:
        with urllib.request.urlopen(signed_sms_request(config, phone, code), timeout=10) as response:
            data = json.loads(response.read(65536)).get("Response", {})
        statuses = data.get("SendStatusSet", [])
        if data.get("Error") or len(statuses) != 1 or statuses[0].get("Code") != "Ok":
            raise ValueError("SMS rejected")
    except Exception:
        # Provider errors may contain phone numbers, payloads, or credentials.
        raise AuthError("短信暂时发送失败，请稍后重试", 502) from None


class PhoneAuth:
    def __init__(self, config, data_dir, sender=send_tencent_sms, now=time.time):
        self.config, self.sender, self.now = config, sender, now
        directory = Path(data_dir)
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        directory.chmod(0o700)
        key_path = directory / "code.key"
        try:
            descriptor = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            pass
        else:
            with os.fdopen(descriptor, "wb") as handle:
                handle.write(secrets.token_bytes(32))
        self.key = key_path.read_bytes()
        if len(self.key) != 32:
            raise ValueError("Invalid authentication data key")
        self.db = sqlite3.connect(directory / "auth.sqlite3", check_same_thread=False)
        (directory / "auth.sqlite3").chmod(0o600)
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS codes (phone TEXT PRIMARY KEY, digest TEXT, expires REAL, attempts INTEGER, ready INTEGER);
            CREATE TABLE IF NOT EXISTS sends (phone TEXT, created REAL);
            CREATE TABLE IF NOT EXISTS sessions (digest TEXT PRIMARY KEY, phone TEXT, expires REAL);
            CREATE TABLE IF NOT EXISTS ip_events (address TEXT, created REAL);
        """)
        self.db.commit()
        self.lock = threading.Lock()

    def _require_ready(self):
        if not self.config.ready:
            raise AuthError("手机号登录尚未启用，管理员正在开通短信服务", 503)

    def _owner(self, value):
        self._require_ready()
        phone = normalize_phone(value)
        if not hmac.compare_digest(phone, normalize_phone(self.config.owner_phone)):
            raise AuthError("这个私人游戏只允许已授权的手机号登录", 403)
        return phone

    def _digest(self, value):
        return hmac.new(self.key, value.encode(), hashlib.sha256).hexdigest()

    def _ip_limit(self, address):
        now = self.now()
        self.db.execute("DELETE FROM ip_events WHERE created < ?", (now - 3600,))
        count = self.db.execute("SELECT count(*) FROM ip_events WHERE address=? AND created>?", (address, now - 60)).fetchone()[0]
        if count >= 20:
            raise AuthError("操作太频繁，请稍后再试", 429, 60)
        self.db.execute("INSERT INTO ip_events VALUES (?,?)", (address, now))

    def send(self, value, address):
        with self.lock, self.db:
            self._ip_limit(address)
        phone = self._owner(value)
        code = str(secrets.randbelow(1000000)).zfill(6)
        digest = self._digest(phone + ":" + code)
        now = self.now()
        with self.lock, self.db:
            self.db.execute("DELETE FROM sends WHERE created<?", (now - 86400,))
            history = [row[0] for row in self.db.execute("SELECT created FROM sends WHERE phone=?", (phone,))]
            last = max(history, default=now - 60)
            if now - last < 60:
                raise AuthError("请稍后再获取验证码", 429, max(1, int(60 - (now - last))))
            if len(history) >= 10 or sum(sent > now - 3600 for sent in history) >= 5:
                raise AuthError("获取次数已达上限，请稍后再试", 429, 3600)
            # Reserve the send before the network call; concurrent requests cannot send twice.
            self.db.execute("INSERT INTO sends VALUES (?,?)", (phone, now))
            self.db.execute("INSERT OR REPLACE INTO codes VALUES (?,?,?,0,0)", (phone, digest, now + CODE_TTL))
        try:
            self.sender(self.config, phone, code)
        except Exception:
            with self.lock, self.db:
                self.db.execute("DELETE FROM codes WHERE phone=? AND digest=?", (phone, digest))
            raise AuthError("短信暂时发送失败，请稍后重试", 502) from None
        with self.lock, self.db:
            self.db.execute("UPDATE codes SET ready=1 WHERE phone=? AND digest=?", (phone, digest))
        return {"sent": True, "retryAfter": 60, "expiresIn": CODE_TTL}

    def verify(self, value, code, address):
        with self.lock, self.db:
            self._ip_limit(address)
        phone = self._owner(value)
        if not isinstance(code, str) or not re.fullmatch(r"\d{6}", code):
            raise AuthError("请输入 6 位短信验证码")
        now, token = self.now(), secrets.token_urlsafe(32)
        failure = False
        with self.lock, self.db:
            row = self.db.execute("SELECT digest,expires,attempts,ready FROM codes WHERE phone=?", (phone,)).fetchone()
            if not row or not row[3] or row[1] <= now or row[2] >= 5:
                failure = True
            elif not hmac.compare_digest(row[0], self._digest(phone + ":" + code)):
                self.db.execute("UPDATE codes SET attempts=attempts+1 WHERE phone=?", (phone,))
                failure = True
            else:
                self.db.execute("DELETE FROM codes WHERE phone=?", (phone,))
                self.db.execute("DELETE FROM sessions WHERE expires<=?", (now,))
                self.db.execute("INSERT INTO sessions VALUES (?,?,?)", (self._digest(token), phone, now + SESSION_TTL))
        if failure:
            raise AuthError("验证码错误或已过期，请重新获取")
        return token

    def session(self, token):
        if not self.config.ready or not token or len(token) > 128:
            return None
        with self.lock:
            row = self.db.execute("SELECT phone,expires FROM sessions WHERE digest=?", (self._digest(token),)).fetchone()
        if not row or row[1] <= self.now():
            return None
        try:
            self._owner(row[0])
        except AuthError:
            return None
        phone = row[0][3:]
        return {"displayName": "玩家" + phone[-4:], "maskedPhone": phone[:3] + "****" + phone[-4:]}

    def logout(self, token):
        with self.lock, self.db:
            self.db.execute("DELETE FROM sessions WHERE digest=?", (self._digest(token or ""),))

    def close(self):
        self.db.close()


@dataclass(frozen=True)
class DemoConfig:
    owner_phone: str = ""

    @property
    def ready(self):
        return True


class DemoPhoneAuth(PhoneAuth):
    """Explicit demo mode displays codes and never contacts an SMS service."""
    demo = True

    def __init__(self, data_dir, owner_phone="", now=time.time):
        self.demo_codes = {}
        def display(config, phone, code):
            self.demo_codes[phone] = code
        super().__init__(DemoConfig(owner_phone), data_dir, sender=display, now=now)

    def _owner(self, value):
        phone = normalize_phone(value)
        if self.config.owner_phone and phone != normalize_phone(self.config.owner_phone):
            raise AuthError("这个演示入口只允许已授权的手机号登录", 403)
        return phone

    def send(self, value, address):
        result = super().send(value, address)
        result["demoCode"] = self.demo_codes[normalize_phone(value)]
        return result
