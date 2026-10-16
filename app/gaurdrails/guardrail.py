from langchain_groq import ChatGroq
from nemoguardrails import RailsConfig, LLMRails

from app.config import settings
from app.gaurdrails.colang_rules import COLANG_CONTENT, YAML_CONTENT, RAIL_INDICATORS


_rails: LLMRails | None = None


def initialize_rails() -> None:
    global _rails

    guard_llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
        temperature=0,
    )

    config = RailsConfig.from_content(
        colang_content=COLANG_CONTENT,
        yaml_content=YAML_CONTENT,
    )

    _rails = LLMRails(
        config,
        llm=guard_llm,
    )

    print("NeMo Guardrails initialized.")


def guard(message: str) -> tuple[bool, str | None]:
    if _rails is None:
        print("Guardrails not initialized — skipping guard.")
        return False, None

    print(f"Guardrails checking: {message[:100]}")

    result = _rails.generate(
        messages=[
            {
                "role": "user",
                "content": message,
            }
        ]
    )

    content = (
        result.get("content", "")
        if isinstance(result, dict)
        else str(result)
    )

    fired = any(
        indicator.lower() in content.lower()
        for indicator in RAIL_INDICATORS
    )

    if fired:
        print(f"Guardrail fired: {message[:100]}")
        return True, content

    print("Guardrails passed.")
    return False, None