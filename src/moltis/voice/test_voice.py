"""
Tests for FHE Voice Provider
"""

import pytest
from fhe_voice import FHEVoiceProvider, VoiceConfig


@pytest.fixture
def voice_provider():
    return FHEVoiceProvider(VoiceConfig(threshold=2))


@pytest.mark.asyncio
async def test_process_voice_command(voice_provider):
    """Test processing voice command"""
    audio = b"hello voice"
    result = await voice_provider.process_voice_command(audio, threshold=2)
    assert "transcribed_audio" in result


@pytest.mark.asyncio
async def test_insufficient_permits(voice_provider):
    """Test insufficient permits raises error"""
    audio = b"hello"

    with pytest.raises(ValueError, match="Insufficient permits"):
        await voice_provider.process_voice_command(audio, threshold=1)


@pytest.mark.asyncio
async def test_encrypt_decrypt_audio(voice_provider):
    """Test audio encryption and decryption"""
    original = b"voice audio data"

    encrypted = await voice_provider.encrypt_audio(original, threshold=2)
    assert encrypted.startswith("ZmhlXw==")  # base64("fhe_")

    decrypted = await voice_provider.decrypt_audio(encrypted, threshold=2)
    assert decrypted == original


@pytest.mark.asyncio
async def test_encrypt_insufficient_permits(voice_provider):
    """Test encrypt with insufficient permits"""
    with pytest.raises(ValueError, match="Insufficient permits"):
        await voice_provider.encrypt_audio(b"audio", threshold=1)


@pytest.mark.asyncio
async def test_decrypt_insufficient_permits(voice_provider):
    """Test decrypt with insufficient permits"""
    encrypted = await voice_provider.encrypt_audio(b"audio", threshold=2)

    with pytest.raises(ValueError, match="Insufficient permits"):
        await voice_provider.decrypt_audio(encrypted, threshold=1)


@pytest.mark.asyncio
async def test_voice_provider_multiple_commands(voice_provider):
    """Test multiple voice commands"""
    audio1 = b"first command"
    audio2 = b"second command"

    result1 = await voice_provider.process_voice_command(audio1, threshold=2)
    result2 = await voice_provider.process_voice_command(audio2, threshold=2)

    assert "transcribed_audio" in result1
    assert "transcribed_audio" in result2
