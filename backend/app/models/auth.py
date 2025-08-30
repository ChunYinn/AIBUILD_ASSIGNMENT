from __future__ import annotations

from pydantic import BaseModel, Field

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginResponse(BaseModel):
    user: UserResponse
    token: Token