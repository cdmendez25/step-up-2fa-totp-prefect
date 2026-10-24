import base64

import pytest

from app import totp

# Apéndice B del RFC 6238 (SHA-1, 8 dígitos). Secreto ASCII "12345678901234567890".
RFC_KEY = b"12345678901234567890"
RFC_SECRET_B32 = base64.b32encode(RFC_KEY).decode()
RFC_VECTORS = [
    (59, "94287082"),
    (1111111109, "07081804"),
    (1111111111, "14050471"),
    (1234567890, "89005924"),
    (2000000000, "69279037"),
    (20000000000, "65353130"),
]


@pytest.mark.parametrize(("unix_time", "expected"), RFC_VECTORS)
def test_rfc6238_vectors_8_digits(unix_time, expected):
    assert totp.hotp(RFC_KEY, totp.counter_at(unix_time), digits=8) == expected


@pytest.mark.parametrize(("unix_time", "expected"), RFC_VECTORS)
def test_6_digits_are_the_last_6_of_the_rfc_code(unix_time, expected):
    assert totp.generate_totp(RFC_SECRET_B32, unix_time) == expected[-6:]


def test_base32_accepts_spaces_lowercase_and_missing_padding():
    spaced = " ".join(RFC_SECRET_B32.rstrip("=")[i : i + 4] for i in range(0, 32, 4)).lower()
    assert totp.decode_base32(spaced) == RFC_KEY


def test_generated_secret_is_160_bits():
    assert len(totp.decode_base32(totp.generate_secret())) == 20


@pytest.mark.parametrize("window", [-1, 0, 1])
def test_verify_reports_the_matching_window(window):
    now = 1_700_000_015.0
    code = totp.generate_totp(RFC_SECRET_B32, now + window * totp.PERIOD)
    assert totp.verify_totp(RFC_SECRET_B32, code, now) == window


def test_verify_rejects_codes_two_windows_away():
    now = 1_700_000_015.0
    code = totp.generate_totp(RFC_SECRET_B32, now - 2 * totp.PERIOD)
    assert totp.verify_totp(RFC_SECRET_B32, code, now) is None


def test_provisioning_uri_has_what_authenticator_apps_expect():
    uri = totp.provisioning_uri("JBSWY3DPEHPK3PXP", "carlos", "Boveda 2FA")
    assert uri.startswith("otpauth://totp/Boveda%202FA%3Acarlos?")
    assert "secret=JBSWY3DPEHPK3PXP" in uri
    assert "digits=6" in uri and "period=30" in uri and "algorithm=SHA1" in uri
