"""Abstract base class for AI providers used in analysis synthesis."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    """Interface that all AI provider implementations must satisfy.

    Providers are responsible for transforming a prompt into a text
    completion suitable for inclusion in the analysis result.
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the name of the underlying model."""

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Return whether the provider is reachable and ready."""

    @abstractmethod
    async def __call__(self, prompt: str, **kwargs: Any) -> str:
        """Invoke the AI model with *prompt* and return its text response.

        Args:
            prompt: The user-facing prompt string.
            **kwargs: Provider-specific parameters (temperature, max_tokens, etc.).

        Returns:
            A non-empty text string from the model.

        Raises:
            RuntimeError: If the provider is unavailable or times out.
        """

    @abstractmethod
    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        """Convenience alias for :meth:`__call__`."""
        ...

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """Return diagnostic information about the provider's state."""


class ModelRegistry:
    """Lightweight registry that maps logical names to concrete providers.

    Usage::

        reg = ModelRegistry()
        reg.register("default", OllamaProvider(model="llama3.2"))
        prov = reg.resolve("default")
    """

    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}

    def register(self, name: str, provider: AIProvider) -> None:
        """Register *provider* under *name*."""
        self._providers[name] = provider

    def resolve(self, name: str) -> AIProvider:
        """Return the provider for *name*, or the default if none matched."""
        if name in self._providers:
            return self._providers[name]
        # Return first available provider as fallback
        for prov in self._providers.values():
            if prov.is_available:
                return prov
        raise RuntimeError("No AI providers registered or available")

    def has(self, name: str) -> bool:
        return name in self._providers

    @property
    def default_name(self) -> str | None:
        """Return the first registered provider's name."""
        if self._providers:
            return next(iter(self._providers))
        return None
