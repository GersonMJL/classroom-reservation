import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password_sha256(password: str) -> str:
    """
    Hash password using SHA256 to ensure it's under bcrypt's 72-byte limit.
    This pre-hashing step ensures consistent password handling regardless of input length.
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password
    """
    # Hash the plain password with SHA256 first, then verify with bcrypt
    sha256_hash = _hash_password_sha256(plain_password)
    return pwd_context.verify(sha256_hash, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate password hash from plain password.
    First hashes with SHA256 to handle passwords of any length,
    then applies bcrypt for secure storage.
    """
    # Pre-hash with SHA256 to ensure input to bcrypt is always under 72 bytes
    sha256_hash = _hash_password_sha256(password)
    return pwd_context.hash(sha256_hash)


# Alias for compatibility
hash_password = get_password_hash
