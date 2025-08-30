from __future__ import annotations

from datetime import date
from datetime import datetime
from datetime import UTC
from typing import Any
from uuid import UUID
from uuid import uuid4

from sqlalchemy import JSON
from sqlalchemy import UniqueConstraint
from sqlmodel import Column
from sqlmodel import create_engine
from sqlmodel import Field
from sqlmodel import Session
from sqlmodel import SQLModel
from sqlmodel import text

from app.core.config import get_settings


settings = get_settings()
DATABASE_URL = settings.DATABASE_URL


def uuid_pk():
    return Field(
        default_factory=uuid4,
        primary_key=True,
        sa_column_kwargs={'server_default': text('gen_random_uuid()')},
    )

# ========== Core Tables ==========

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: UUID = uuid_pk()
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

class Product(SQLModel, table=True):
    __tablename__ = "products"
    
    id: UUID = uuid_pk()
    user_id: UUID = Field(foreign_key="users.id")
    product_id: str  # Original ID from Excel (e.g., '0000001')
    name: str
    opening_inventory: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='unique_user_product'),
    )

class ProcurementData(SQLModel, table=True):
    __tablename__ = "procurement_data"
    
    id: UUID = uuid_pk()
    product_id: UUID = Field(foreign_key="products.id")
    day: int
    quantity: int
    price: float
    amount: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    
    __table_args__ = (
        UniqueConstraint('product_id', 'day', name='unique_product_procurement_day'),
    )

class SalesData(SQLModel, table=True):
    __tablename__ = "sales_data"
    
    id: UUID = uuid_pk()
    product_id: UUID = Field(foreign_key="products.id")
    day: int
    quantity: int
    price: float
    amount: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    
    __table_args__ = (
        UniqueConstraint('product_id', 'day', name='unique_product_sales_day'),
    )

class ExcelUpload(SQLModel, table=True):
    __tablename__ = "excel_uploads"
    
    id: UUID = uuid_pk()
    user_id: UUID = Field(foreign_key="users.id")
    filename: str
    upload_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    status: str = Field(default="processing")  # processing/completed/failed



# ========== Database Setup ==========

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)


def create_db_and_tables(drop_first: bool = False) -> None:
    if drop_first:
        with engine.begin() as conn:
            conn.execute(text('DROP SCHEMA public CASCADE'))
            conn.execute(text('CREATE SCHEMA public'))
    SQLModel.metadata.create_all(engine)


def get_db():
    with Session(engine) as db:
        try:
            yield db
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()
