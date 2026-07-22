import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core.security import get_password_hash

# Use in-memory SQLite database for testing
DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db_session", scope="function")
def db_session_fixture():
    # Create all tables in the test database
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after the test finishes
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client", scope="function")
def client_fixture(db_session):
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(name="normal_user")
def normal_user_fixture(db_session):
    from app.models.user import User
    
    hashed_password = get_password_hash("password123")
    user = User(
        email="user@example.com",
        hashed_password=hashed_password,
        is_admin=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(name="admin_user")
def admin_user_fixture(db_session):
    from app.models.user import User
    
    hashed_password = get_password_hash("adminpassword")
    user = User(
        email="admin@example.com",
        hashed_password=hashed_password,
        is_admin=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
