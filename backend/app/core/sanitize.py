import bleach

def sanitize_text(value: str) -> str:
    """Strips HTML/script tags from user-supplied text, keeping only plain text content."""
    if value is None:
        return value
    return bleach.clean(value, tags=[], attributes={}, strip=True)