from pydantic import BaseModel, Field
from typing import Optional

class VehicleBase(BaseModel):
    make: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    price: float = Field(..., gt=0.0)
    quantity: int = Field(..., ge=0)

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    make: Optional[str] = Field(None, min_length=1)
    model: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1)
    price: Optional[float] = Field(None, gt=0.0)
    quantity: Optional[int] = Field(None, ge=0)

class VehicleRestock(BaseModel):
    quantity: int = Field(..., gt=0)

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True
