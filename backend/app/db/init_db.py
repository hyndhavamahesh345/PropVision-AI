from sqlalchemy.orm import Session
from backend.app.db.session import engine, Base
from backend.app.db.models import User
from backend.app.core.security import get_password_hash
from backend.app.core.config import settings

def init_db(db: Session) -> None:
    # Tables are created if they don't exist
    Base.metadata.create_all(bind=engine)

    # Seed first superuser if not exists
    user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if not user:
        new_user = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            is_superuser=True,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
