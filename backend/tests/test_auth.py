def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "newpassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "password" not in data
    assert data["is_admin"] is False


def test_register_user_duplicate_email(client, normal_user):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": normal_user.email, "password": "anotherpassword"}
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, normal_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": normal_user.email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_incorrect_credentials(client, normal_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": normal_user.email, "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()
