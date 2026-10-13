from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: EmailStr
    licensePlate: Optional[str] = Field(default="ABC-1234", max_length=32)
    role: Optional[str] = Field(default="USER", pattern="^(USER|ADMIN)$")
    phone: Optional[str] = None
    department: Optional[str] = None
    preferredZone: Optional[str] = Field(default="A", pattern="^(A|B|ANY)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=4, max_length=128)


class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None  # OAuth2 form compatibility
    password: str = Field(..., min_length=4)


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    licensePlate: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    preferredZone: Optional[str] = "A"
    registeredAt: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
