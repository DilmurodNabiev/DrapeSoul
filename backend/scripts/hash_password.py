"""Generate bcrypt password hash for OWNER_PASSWORD_HASH."""
import sys

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python hash_password.py <password>")
        sys.exit(1)
    print(pwd_context.hash(sys.argv[1]))
