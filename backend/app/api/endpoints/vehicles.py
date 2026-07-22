from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import vehicle as vehicle_crud
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleRestock, VehicleResponse
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[VehicleResponse])
def read_vehicles(
    make: Optional[str] = None,
    model: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
):
    return vehicle_crud.get_vehicles(
        db, make=make, model=model, category=category, min_price=min_price, max_price=max_price, skip=skip, limit=limit
    )


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def read_vehicle(vehicle_id: int, db: Session = Depends(deps.get_db)):
    db_vehicle = vehicle_crud.get_vehicle(db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return db_vehicle


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
):
    return vehicle_crud.create_vehicle(db=db, vehicle_in=vehicle_in)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
):
    db_vehicle = vehicle_crud.get_vehicle(db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle_crud.update_vehicle(db=db, db_vehicle=db_vehicle, vehicle_in=vehicle_in)


@router.delete("/{vehicle_id}", response_model=VehicleResponse)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
):
    db_vehicle = vehicle_crud.delete_vehicle(db=db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return db_vehicle


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase_vehicle(
    vehicle_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    db_vehicle = vehicle_crud.get_vehicle(db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    updated_vehicle = vehicle_crud.purchase_vehicle(db=db, db_vehicle=db_vehicle)
    if not updated_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle out of stock"
        )
    return updated_vehicle


@router.post("/{vehicle_id}/restock", response_model=VehicleResponse)
def restock_vehicle(
    vehicle_id: int,
    restock_in: VehicleRestock,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
):
    db_vehicle = vehicle_crud.get_vehicle(db, vehicle_id=vehicle_id)
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle_crud.restock_vehicle(db=db, db_vehicle=db_vehicle, quantity=restock_in.quantity)
