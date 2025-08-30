from __future__ import annotations

from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select

from app.core.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user
)
from app.db import User
from app.dependencies.db import DB
from app.models.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    Token,
    LoginResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: DB):
    # Check if username already exists
    statement = select(User).where(User.username == user_data.username)
    existing_user = db.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        password_hash=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=str(db_user.id),
        username=db_user.username
    )

@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin, db: DB):
    # Find user by username
    statement = select(User).where(User.username == user_credentials.username)
    user = db.exec(statement).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    return LoginResponse(
        user=UserResponse(
            id=str(user.id),
            username=user.username
        ),
        token=Token(access_token=access_token)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username
    )

@router.post("/logout")
async def logout():
    # In a real app, you might want to blacklist the token
    # For now, just return success - frontend will remove the token
    return {"message": "Successfully logged out"}