from dataclasses import dataclass
from enum import Enum


class AuthEnforcementMode(str, Enum):
    OFF = "off"
    SHADOW = "shadow"
    ENFORCED = "enforced"


@dataclass(frozen=True, slots=True)
class VerifiedTokenClaims:
    sub: str
    email: str | None = None
