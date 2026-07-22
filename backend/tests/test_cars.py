import pytest

# Helper to get auth header
def get_auth_header(client, email, password):
    # If they are registered in fixture, login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def normal_user_headers(client, normal_user):
    return get_auth_header(client, "user@example.com", "password123")


@pytest.fixture
def admin_headers(client, admin_user):
    return get_auth_header(client, "admin@example.com", "adminpassword")


@pytest.fixture
def sample_vehicle(db_session):
    from app.models.vehicle import Vehicle
    vehicle = Vehicle(
        make="Toyota",
        model="Camry",
        category="Sedan",
        price=25000.0,
        quantity=5
    )
    db_session.add(vehicle)
    db_session.commit()
    db_session.refresh(vehicle)
    return vehicle


# Test Get Vehicles list & Filter/Search
def test_get_vehicles_and_search(client, sample_vehicle, db_session):
    from app.models.vehicle import Vehicle
    # Add another vehicle
    v2 = Vehicle(make="Ford", model="F-150", category="Truck", price=45000.0, quantity=2)
    db_session.add(v2)
    db_session.commit()

    # Get all
    response = client.get("/api/v1/vehicles")
    assert response.status_code == 200
    assert len(response.json()) == 2

    # Filter by make
    response = client.get("/api/v1/vehicles?make=Toyota")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["make"] == "Toyota"

    # Filter by price range
    response = client.get("/api/v1/vehicles?min_price=20000&max_price=30000")
    assert len(response.json()) == 1
    assert response.json()[0]["make"] == "Toyota"


# Test Create Vehicle (Admin vs Normal User)
def test_create_vehicle_admin(client, admin_headers):
    payload = {
        "make": "Tesla",
        "model": "Model 3",
        "category": "Electric",
        "price": 39990.0,
        "quantity": 10
    }
    response = client.post("/api/v1/vehicles", json=payload, headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["make"] == "Tesla"


def test_create_vehicle_non_admin(client, normal_user_headers):
    payload = {
        "make": "Tesla",
        "model": "Model 3",
        "category": "Electric",
        "price": 39990.0,
        "quantity": 10
    }
    response = client.post("/api/v1/vehicles", json=payload, headers=normal_user_headers)
    assert response.status_code == 403  # Forbidden for non-admins


# Test Update Vehicle
def test_update_vehicle_admin(client, sample_vehicle, admin_headers):
    payload = {"price": 24000.0, "quantity": 4}
    response = client.put(f"/api/v1/vehicles/{sample_vehicle.id}", json=payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["price"] == 24000.0
    assert response.json()["quantity"] == 4


# Test Delete Vehicle (Admin only)
def test_delete_vehicle_admin(client, sample_vehicle, admin_headers):
    response = client.delete(f"/api/v1/vehicles/{sample_vehicle.id}", headers=admin_headers)
    assert response.status_code == 200
    
    # Check it is gone
    response = client.get(f"/api/v1/vehicles/{sample_vehicle.id}")
    assert response.status_code == 404


def test_delete_vehicle_non_admin(client, sample_vehicle, normal_user_headers):
    response = client.delete(f"/api/v1/vehicles/{sample_vehicle.id}", headers=normal_user_headers)
    assert response.status_code == 403


# Test Purchase Vehicle (Decreases stock)
def test_purchase_vehicle_success(client, sample_vehicle, normal_user_headers):
    response = client.post(f"/api/v1/vehicles/{sample_vehicle.id}/purchase", headers=normal_user_headers)
    assert response.status_code == 200
    assert response.json()["quantity"] == 4


def test_purchase_vehicle_out_of_stock(client, db_session, normal_user_headers):
    from app.models.vehicle import Vehicle
    out_of_stock = Vehicle(make="Honda", model="Civic", category="Sedan", price=20000.0, quantity=0)
    db_session.add(out_of_stock)
    db_session.commit()
    db_session.refresh(out_of_stock)

    response = client.post(f"/api/v1/vehicles/{out_of_stock.id}/purchase", headers=normal_user_headers)
    assert response.status_code == 400
    assert "out of stock" in response.json()["detail"].lower()


# Test Restock Vehicle (Admin only)
def test_restock_vehicle_admin(client, sample_vehicle, admin_headers):
    payload = {"quantity": 10}  # Add 10 to inventory
    response = client.post(f"/api/v1/vehicles/{sample_vehicle.id}/restock", json=payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["quantity"] == 15  # 5 + 10 = 15


def test_restock_vehicle_non_admin(client, sample_vehicle, normal_user_headers):
    payload = {"quantity": 10}
    response = client.post(f"/api/v1/vehicles/{sample_vehicle.id}/restock", json=payload, headers=normal_user_headers)
    assert response.status_code == 403
