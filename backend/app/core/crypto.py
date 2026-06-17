"""
AES-CBC/PKCS5 encryption for Cleanverse API.
Key: base64-decoded api-key. IV: 16 zero bytes.
"""
import base64
import json

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

_IV = bytes(16)  # 16 zero bytes


def _key(api_key_b64: str) -> bytes:
    return base64.b64decode(api_key_b64)


def encrypt(payload: dict, api_key_b64: str) -> str:
    """Encrypt dict payload → base64 ciphertext string."""
    plaintext = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    cipher = AES.new(_key(api_key_b64), AES.MODE_CBC, _IV)
    ct = cipher.encrypt(pad(plaintext, AES.block_size))
    return base64.b64encode(ct).decode("utf-8")


def decrypt(ciphertext_b64: str, api_key_b64: str) -> dict:
    """Decrypt base64 ciphertext → dict."""
    ct = base64.b64decode(ciphertext_b64)
    cipher = AES.new(_key(api_key_b64), AES.MODE_CBC, _IV)
    plaintext = unpad(cipher.decrypt(ct), AES.block_size)
    return json.loads(plaintext.decode("utf-8"))


def wrap(payload: dict, api_key_b64: str) -> dict:
    """Return {"data": "<ciphertext>"} ready to POST."""
    return {"data": encrypt(payload, api_key_b64)}
