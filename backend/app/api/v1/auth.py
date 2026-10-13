from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenOut
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(User).where(User.email == data.email.lower().strip())
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    new_user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password),
        role=data.role or "USER",
        license_plate=data.licensePlate.strip().upper() if data.licensePlate else "ABC-1234",
        phone=data.phone,
        department=data.department,
        preferred_zone=data.preferredZone or "A",
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(subject=new_user.id, role=new_user.role)
    return TokenOut(access_token=token, user=UserOut(**new_user.to_dict()))


@router.post("/login", response_model=TokenOut)
async def login_user(data: UserLogin, db: AsyncSession = Depends(get_db)):
    email = (data.email or data.username or "").lower().strip()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required.",
        )

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(subject=user.id, role=user.role)
    return TokenOut(access_token=token, user=UserOut(**user.to_dict()))


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserOut(**current_user.to_dict())


@router.put("/me", response_model=UserOut)
async def update_my_profile(
    name: Optional[str] = None,
    licensePlate: Optional[str] = None,
    preferredZone: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if name:
        current_user.name = name.strip()
    if licensePlate:
        current_user.license_plate = licensePlate.strip().upper()
    if preferredZone:
        current_user.preferred_zone = preferredZone.strip().upper()

    await db.commit()
    await db.refresh(current_user)
    return UserOut(**current_user.to_dict())
