"""
LLM Provider Configuration

Supports Groq (Llama 3.3 70B Versatile), Gemini, and OpenAI.
Selection is automatic based on available API keys or via LLM_PROVIDER.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load from .env, .env.local, and parent directory if needed
root_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(root_dir / ".env.local")
load_dotenv(root_dir / ".env")
load_dotenv()


def get_llm():
    """
    Return the configured LLM instance based on environment variables.

    Supported providers:
        - "groq" → langchain-groq (ChatGroq with llama-3.3-70b-versatile) [Recommended / Free]
        - "gemini" → langchain-google-genai (ChatGoogleGenerativeAI)
        - "openai" → langchain-openai (ChatOpenAI)

    Environment variables:
        - LLM_PROVIDER: "groq", "gemini", or "openai" (auto-detected if unset)
        - GROQ_API_KEY: API key for Groq Cloud (Free high-speed inference)
        - GROQ_MODEL: Model ID for Groq (default: "llama-3.3-70b-versatile")
        - GEMINI_API_KEY: API key for Google Gemini
        - OPENAI_API_KEY: API key for OpenAI
    """
    provider = os.getenv("LLM_PROVIDER", "").lower()

    # Auto-detect provider if not explicitly set
    if not provider:
        if os.getenv("GROQ_API_KEY"):
            provider = "groq"
        elif os.getenv("GEMINI_API_KEY"):
            provider = "gemini"
        elif os.getenv("OPENAI_API_KEY"):
            provider = "openai"
        else:
            provider = "groq"

    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required when using Groq")

        model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

        try:
            from langchain_groq import ChatGroq

            return ChatGroq(
                model=model_name,
                groq_api_key=api_key,
                temperature=0.2,
                max_tokens=1024,
            )
        except ImportError:
            # Fallback to OpenAI-compatible endpoint if langchain-groq isn't installed
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=model_name,
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
                temperature=0.2,
                max_tokens=1024,
            )

    elif provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=api_key,
            temperature=0.3,
            max_output_tokens=1024,
        )

    elif provider == "openai":
        from langchain_openai import ChatOpenAI

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        return ChatOpenAI(
            model="gpt-4o-mini",
            api_key=api_key,
            temperature=0.3,
            max_tokens=1024,
        )

    else:
        raise ValueError(
            f"Unknown LLM provider: '{provider}'. Supported providers: 'groq', 'gemini', 'openai'."
        )
