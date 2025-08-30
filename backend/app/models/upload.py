from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProcurementSalesDay(BaseModel):
    day: int
    procurement_qty: int = 0
    procurement_price: float = 0.0
    sales_qty: int = 0
    sales_price: float = 0.0

class ExcelUploadResponse(BaseModel):
    message: str
    upload_id: str
    products_processed: int
    status: str
    validation_info: Optional[Dict[str, Any]] = None

class ProductDataResponse(BaseModel):
    id: str
    product_id: str
    name: str
    opening_inventory: int
    procurement_data: List[dict]
    sales_data: List[dict]

class ProductListResponse(BaseModel):
    products: List[ProductDataResponse]
    total: int