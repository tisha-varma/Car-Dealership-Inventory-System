from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def get_vehicle(db: Session, vehicle_id: int) -> Optional[Vehicle]:
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def get_vehicles(
    db: Session,
    make: Optional[str] = None,
    model: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Vehicle]:
    query = db.query(Vehicle)
    if make:
        query = query.filter(Vehicle.make.contains(make))
    if model:
        query = query.filter(Vehicle.model.contains(model))
    if category:
        query = query.filter(Vehicle.category.contains(category))
    if min_price is not None:
        query = query.filter(Vehicle.price >= min_price)
    if max_price is not None:
        query = query.filter(Vehicle.price <= max_price)
    
    return query.offset(skip).limit(limit).all()


def create_vehicle(db: Session, vehicle_in: VehicleCreate) -> Vehicle:
    db_vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def update_vehicle(db: Session, db_vehicle: Vehicle, vehicle_in: VehicleUpdate) -> Vehicle:
    update_data = vehicle_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vehicle, field, value)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def delete_vehicle(db: Session, vehicle_id: int) -> Optional[Vehicle]:
    db_vehicle = get_vehicle(db, vehicle_id)
    if db_vehicle:
        db.delete(db_vehicle)
        db.commit()
    return db_vehicle


def purchase_vehicle(db: Session, db_vehicle: Vehicle) -> Optional[Vehicle]:
    if db_vehicle.quantity > 0:
        db_vehicle.quantity -= 1
        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        return db_vehicle
    return None


def restock_vehicle(db: Session, db_vehicle: Vehicle, quantity: int) -> Vehicle:
    db_vehicle.quantity += quantity
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle
