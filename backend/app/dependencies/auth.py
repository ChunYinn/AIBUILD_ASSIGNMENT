from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.core.auth import get_current_user
from app.db import User

CurrentUser = Annotated[User, Depends(get_current_user)]