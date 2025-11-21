import pytest
from app import models


def test_register_user(client, db):
    """
    Test user registration endpoint.
    """
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["is_active"] is True
    
    # Verify user was created in database
    user = db.query(models.User).filter(models.User.email == "test@example.com").first()
    assert user is not None
    assert user.username == "testuser"


def test_register_duplicate_email(client, db):
    """
    Test that registering with duplicate email fails.
    """
    # Create first user
    client.post(
        "/api/auth/register",
        json={
            "username": "user1",
            "email": "duplicate@example.com",
            "password": "password123",
        }
    )
    
    # Try to create second user with same email
    response = client.post(
        "/api/auth/register",
        json={
            "username": "user2",
            "email": "duplicate@example.com",
            "password": "password456",
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, db):
    """
    Test successful login.
    """
    # Register user first
    client.post(
        "/api/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "loginpass123",
        }
    )
    
    # Login
    response = client.post(
        "/api/auth/login",
        json={
            "username": "loginuser",
            "password": "loginpass123",
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client, db):
    """
    Test login with invalid credentials.
    """
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "correctpassword",
        }
    )
    
    # Try login with wrong password
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "wrongpassword",
        }
    )
    assert response.status_code == 401


def test_get_current_user(client, db):
    """
    Test getting current user information with valid token.
    """
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "username": "currentuser",
            "email": "current@example.com",
            "password": "password123",
        }
    )
    
    # Login to get token
    login_response = client.post(
        "/api/auth/login",
        json={
            "username": "currentuser",
            "password": "password123",
        }
    )
    token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "currentuser"
    assert data["email"] == "current@example.com"


def test_get_current_user_unauthorized(client):
    """
    Test that accessing /me without token fails.
    """
    response = client.get("/api/auth/me")
    assert response.status_code == 401
