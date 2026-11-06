"""Local Ollama-based AI provider implementation.

SAMPLE / PLACEHOLDER IMPLEMENTATION:

This class uses the Ollama HTTP API for local inference.  It is a valid,
working integration but is shown here as an example of how to implement
the :class:`AIProvider` interface.  Replace or extend with production-ready
providers (OpenAI, Anthropic, vLLM, etc.) by implementing the same
interface.
"""

from __future__ import annotations

from typing import Any

import httpx

from src.ai.providers.base import AIProvider


class OllamaProvider(AIProvider):
    """Connect to a local Ollama instance for text generation."""

    def __init__(
        self,
        model: str = "llama3.2",
        base_url: str = "http://localhost:11434",
        timeout: float = 60.0,
    ) -> None:
        """Initialize the provider.

        Args:
            model: Name of the Ollama model to use (e.g. ``"llama3.2"``).
            base_url: Root URL of the Ollama API server.
            timeout: Seconds before an HTTP request is abandoned.
        """
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def is_available(self) -> bool:
        """Check whether the Ollama API responds."""
        try:
            import urllib.request

            url = f"{self._base_url}/api/tags"
            request = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(request, timeout=5.0) as resp:  # type: ignore[no-untyped-call]
                return resp.status == 200
        except Exception:  # noqa: BLE001
            return False

    async def __call__(self, prompt: str, **kwargs: Any) -> str:
        """Invoke Ollama and return the generated text.

        Args:
            prompt: Input text for the model.
            **kwargs: Passed through to ``model.generate`` (temperature, max_tokens, etc.).
        """
        payload: dict[str, Any] = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
        }
        if "temperature" in kwargs:
            payload["temperature"] = kwargs["temperature"]
        if "max_tokens" in kwargs:
            payload["max_tokens"] = kwargs["max_tokens"]

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(f"{self._base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
        return data.get("response", "")  # type: ignore[return-value]

    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        """Alias for :meth:`__call__`."""
        return await self(prompt, **kwargs)

    async def health_check(self) -> dict[str, Any]:
        """Return provider diagnostic info.

        Returns:
            A dict with *status*, *model*, and *base_url* keys.
        """
        try:
            import urllib.request

            url = f"{self._base_url}/api/tags"
            request = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(request, timeout=5.0) as resp:  # type: ignore[no-untyped-call]  # noqa: ASYNC210
                status = "ok" if resp.status == 200 else "unreachable"
        except Exception:  # noqa: BLE001
            status = "unreachable"

        return {
            "status": status,
            "model": self._model,
            "base_url": self._base_url,
        }
