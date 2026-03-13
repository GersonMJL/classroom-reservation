"""
Database repository for User operations.
This follows the repository pattern for clean data access.
"""

from sqlalchemy.orm import Session
from models.database_models import UserModel
from models.user import UserCreate
from core.utils import verify_password


class UserRepository:
    """Handles all database operations for User model."""

    @staticmethod
    def create_user(db: Session, user: UserCreate, hashed_password: str) -> UserModel:
        """Create a new user in the database."""
        db_user = UserModel(
            email=user.email,
            full_name=user.full_name,
            hashed_password=hashed_password,
            is_active=user.is_active,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> UserModel | None:
        """Retrieve user by email."""
        return db.query(UserModel).filter(UserModel.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> UserModel | None:
        """Retrieve user by ID."""
        return db.query(UserModel).filter(UserModel.id == user_id).first()

    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> list[UserModel]:
        """Retrieve all users with pagination."""
        return db.query(UserModel).offset(skip).limit(limit).all()

    @staticmethod
    def update_user(db: Session, user_id: int, user_data: dict) -> UserModel | None:
        """Update user information."""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if db_user:
            for key, value in user_data.items():
                if hasattr(db_user, key):
                    setattr(db_user, key, value)
            db.commit()
            db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Delete a user."""
        db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> UserModel | None:
        """Authenticate user by email and password."""
        user = UserRepository.get_user_by_email(db, email)
        if user and verify_password(password, user.hashed_password):
            return user
        return None
