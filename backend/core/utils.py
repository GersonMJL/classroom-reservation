from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash

pwd_hasher = PasswordHasher()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password.
    """
    try:
        pwd_hasher.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, InvalidHash):
        return False


def get_password_hash(password: str) -> str:
    """
    Generate password hash from plain password.
    """
    return pwd_hasher.hash(password)


# Alias for compatibility
hash_password = get_password_hash
