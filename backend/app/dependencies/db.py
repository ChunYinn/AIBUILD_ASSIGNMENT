from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.db import get_db

DB = Annotated[Session, Depends(get_db)]
