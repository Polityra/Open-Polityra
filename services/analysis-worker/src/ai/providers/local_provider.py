"""Local Ollama-based AI provider implementation.

SAMPLE / PLACEHOLDER IMPLEMENTATION:

This class uses the Ollama HTTP API for local inference.  It is a valid,
working integration but is shown here as an example of how to implement
the :class:`AIProvider` interface.  Replace or extend with production-ready
providers (OpenAI, Anthropic, vLLM, etc.) by implementing the same
interface.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

from src.ai.providers.base import AIProvider


class OllamaProvider(AIProvider):
    """Connect to a local Ollama instance for text generation."""

    def __init__(
        self,
        model: str | None = None,
        base_url: str | None = None,
        timeout: float = 60.0,
    ) -> None:
        """Initialize the provider.

        Args:
            model: Name of the local Ollama model.
            base_url: Root URL of the Ollama API server.
            timeout: Seconds before an HTTP request is abandoned.
        """
        self._model = model or os.getenv("OLLAMA_MODEL") or "olmo-3:7b"
        configured_base_url = base_url or os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434"
        self._base_url = configured_base_url.rstrip("/")
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
            "options": {"temperature": 0.2},
        }
        if "temperature" in kwargs:
            payload["options"]["temperature"] = kwargs["temperature"]
        if "max_tokens" in kwargs:
            payload["options"]["num_predict"] = kwargs["max_tokens"]

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(f"{self._base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
        response = data.get("response")
        return response if isinstance(response, str) else ""

    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        """Alias for :meth:`__call__`."""
        return await self(prompt, **kwargs)

    async def health_check(self) -> dict[str, Any]:
        """Return provider diagnostic info.

        Returns:
            A dict with *status*, *model*, and *base_url* keys.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self._base_url}/api/tags")
                response.raise_for_status()
            models = response.json().get("models", [])
            available = any(
                item.get("model") == self._model or item.get("name") == self._model
                for item in models
                if isinstance(item, dict)
            )
            status = "ok" if available else "model_missing"
        except (httpx.HTTPError, ValueError):
            status = "unreachable"

        return {
            "status": status,
            "model": self._model,
            "base_url": self._base_url,
            "available": status == "ok",
        }
