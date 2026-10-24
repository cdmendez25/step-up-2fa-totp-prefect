import base64

import pytest
from cryptography.exceptions import InvalidTag

from app import pqc


@pytest.fixture(scope="module")
def private_key():
    return pqc.load_private_key(pqc.generate_private_key_b64())


def test_encrypt_then_decrypt_recovers_the_secret(private_key):
    package = pqc.encrypt(private_key, b"JBSWY3DPEHPK3PXP")
    assert package["alg"] == pqc.ALG
    assert pqc.decrypt(private_key, package) == b"JBSWY3DPEHPK3PXP"


def test_exported_key_reloads_to_the_same_key(private_key):
    exported = base64.b64encode(private_key.private_bytes_raw()).decode()
    package = pqc.encrypt(private_key, b"secreto")
    assert pqc.decrypt(pqc.load_private_key(exported), package) == b"secreto"


def test_tampered_ciphertext_is_rejected(private_key):
    package = pqc.encrypt(private_key, b"secreto")
    raw = bytearray(base64.b64decode(package["ciphertext"]))
    raw[0] ^= 0xFF
    package["ciphertext"] = base64.b64encode(bytes(raw)).decode()
    with pytest.raises(InvalidTag):
        pqc.decrypt(private_key, package)


def test_another_private_key_cannot_decrypt(private_key):
    package = pqc.encrypt(private_key, b"secreto")
    other = pqc.load_private_key(pqc.generate_private_key_b64())
    with pytest.raises(InvalidTag):
        pqc.decrypt(other, package)
