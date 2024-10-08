from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DomainBase(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = True

class DomainCreate(DomainBase):
    name: str

class DomainUpdate(DomainBase):
    pass

class DomainInDBBase(DomainBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Domain(DomainInDBBase):
    pass

class DomainInDB(DomainInDBBase):
    pass