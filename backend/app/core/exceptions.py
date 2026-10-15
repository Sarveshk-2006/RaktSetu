"""
RAKTSETU - Domain Exceptions
Defines explicit domain-level exceptions for lifecycle violations,
unverified requirements, duplicate outreach, and over-fulfilment.
"""


class RaktSetuDomainError(Exception):
    """Base domain error for RaktSetu."""
    pass


class InvalidStateTransitionError(RaktSetuDomainError):
    """Raised when an illegal lifecycle state transition is attempted."""
    pass


class UnverifiedRequirementError(RaktSetuDomainError):
    """Raised when mobilisation or outreach is attempted on an unverified requirement."""
    pass


class RequirementAlreadyVerifiedError(RaktSetuDomainError):
    """Raised when attempting to re-verify an already verified requirement."""
    pass


class IncidentNotFoundError(RaktSetuDomainError):
    """Raised when a requested incident cannot be found in persistence."""
    pass


class IncidentOverFulfilmentError(RaktSetuDomainError):
    """Raised when confirmed fulfilment units would exceed the requested quantity."""
    pass


class IncidentClosedError(RaktSetuDomainError):
    """Raised when attempting an operational modification on a closed or cancelled incident."""
    pass


class WaveProgressionError(RaktSetuDomainError):
    """Raised when wave sequence, progression, or evaluation is invalid."""
    pass


class ActiveWaveExistsError(WaveProgressionError):
    """Raised when attempting to launch a new wave while an active wave is currently ongoing."""
    pass


class DuplicateOutreachError(RaktSetuDomainError):
    """Raised when an outreach attempt is dispatched to an already-contacted donor for the same incident."""
    pass


class DuplicateResponseError(RaktSetuDomainError):
    """Raised when conflicting donor responses are submitted."""
    pass


class InvalidResponseStatusError(RaktSetuDomainError):
    """Raised when an unrecognized donor response status is submitted."""
    pass


class CandidatePoolExhaustedError(RaktSetuDomainError):
    """Raised when no eligible, compatible donor candidates remain in the network."""
    pass
