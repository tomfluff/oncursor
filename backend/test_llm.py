from llm import _PROVIDERS, _parse_data_url, analyze_chart_image


def test_parse_data_url():
    mime, data = _parse_data_url("data:image/png;base64,aGVsbG8=")
    assert mime == "image/png"
    assert data == b"hello"


def test_unknown_provider_raises():
    try:
        analyze_chart_image("data:image/png;base64,aGVsbG8=", provider="bogus")
        assert False, "expected ValueError"
    except ValueError as e:
        assert "bogus" in str(e)


def test_providers_registered():
    assert set(_PROVIDERS) == {"openai", "gemini"}


if __name__ == "__main__":
    test_parse_data_url()
    test_unknown_provider_raises()
    test_providers_registered()
    print("ok")
