from urllib.parse import quote


def dicebear_avatar_url(style: str, seed: str) -> str:
	"""Return a stable DiceBear fallback avatar URL for a domain record."""
	return f"https://api.dicebear.com/10.x/{style}/svg?seed={quote(seed, safe='')}"
