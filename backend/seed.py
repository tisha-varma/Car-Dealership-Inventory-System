from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.vehicle import Vehicle
from app.core.security import get_password_hash

def seed_database():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Create Default Admin User
    admin_email = "admin@automax.com"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("adminpassword"),
            is_admin=True
        )
        db.add(admin_user)
        print(f"Created Admin User: {admin_email} (password: adminpassword)")
    else:
        print("Admin user already exists.")

    # 2. Add Sample Vehicles
    sample_cars = [
        {"make": "Tesla", "model": "Model Y", "category": "Electric", "price": 44990.0, "quantity": 8},
        {"make": "Ford", "model": "F-150 Lightning", "category": "Truck", "price": 54995.0, "quantity": 3},
        {"make": "Toyota", "model": "Camry Hybrid", "category": "Sedan", "price": 28400.0, "quantity": 15},
        {"make": "Honda", "model": "CR-V", "category": "SUV", "price": 30100.0, "quantity": 10},
        {"make": "Porsche", "model": "911 Carrera", "category": "Sports", "price": 114400.0, "quantity": 2},
        {"make": "Chevrolet", "model": "Bolt EV", "category": "Electric", "price": 26500.0, "quantity": 0},
    ]

    for car_data in sample_cars:
        existing_car = db.query(Vehicle).filter(
            Vehicle.make == car_data["make"],
            Vehicle.model == car_data["model"]
        ).first()
        
        if not existing_car:
            car = Vehicle(**car_data)
            db.add(car)
            print(f"Added vehicle: {car_data['make']} {car_data['model']}")
        else:
            print(f"Vehicle already exists: {car_data['make']} {car_data['model']}")

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
