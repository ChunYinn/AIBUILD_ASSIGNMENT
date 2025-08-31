from __future__ import annotations

import io
import pandas as pd
import re
from datetime import datetime, UTC
from typing import Any, Dict, List

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from sqlmodel import select

from app.db import User, Product, ProcurementData, SalesData, ExcelUpload
from app.dependencies.auth import CurrentUser
from app.dependencies.db import DB
from app.models.upload import ExcelUploadResponse, ProductDataResponse, ProductListResponse

router = APIRouter(prefix="/upload", tags=["Upload"])

def get_column_name_patterns(day: int) -> Dict[str, List[str]]:
    """Returns different Excel column naming patterns we support"""
    return {
        'procurement_qty': [
            f'Procurement Qty (Day {day})',
            f'Procurement Qty Day {day}',
            f'procurementQty_day{day}'
        ],
        'procurement_price': [
            f'Procurement Price (Day {day})',
            f'Procurement Price Day {day}',
            f'procurementPrice_day{day}'
        ],
        'sales_qty': [
            f'Sales Qty (Day {day})',
            f'Sales Qty Day {day}',
            f'salesQty_day{day}'
        ],
        'sales_price': [
            f'Sales Price (Day {day})',
            f'Sales Price Day {day}',
            f'salesPrice_day{day}'
        ]
    }

def clean_currency_value(value: str) -> float:
    """Remove $ signs and commas from price values"""
    if pd.isna(value) or value == '':
        return 0.0
    
    # Remove $ and commas, then convert to float
    clean_value = str(value).replace('$', '').replace(',', '').strip()
    
    try:
        return float(clean_value)
    except ValueError:
        return 0.0

def detect_max_days(df: pd.DataFrame) -> int:
    """Figure out how many days of data we have by looking at column names"""
    max_day = 0
    
    # Check each column for day numbers
    for col in df.columns:
        col_str = str(col)
        day_matches = re.findall(r'[Dd]ay\s*(\d+)', col_str)
        for match in day_matches:
            max_day = max(max_day, int(match))
    
    # Default to 3 days minimum for backward compatibility
    return max(max_day, 3)

def validate_excel_format(df: pd.DataFrame) -> Dict[str, Any]:
    """Check if the Excel file has the right format"""
    errors = []
    warnings = []
    
    required_columns = ['ID', 'Product Name', 'Opening Inventory']
    missing_required = []
    
    # Check if we have the basic columns we need
    for req_col in required_columns:
        found = False
        possible_names = {
            'ID': ['ID', 'Product ID', 'ProductID', 'id', 'product_id'],
            'Product Name': ['Product Name', 'ProductName', 'Name', 'product_name', 'name'],
            'Opening Inventory': ['Opening Inventory', 'Opening Inventory on Day 1', 'opening_inventory', 'OpeningInventory']
        }
        
        for possible in possible_names.get(req_col, [req_col]):
            if possible in df.columns:
                found = True
                break
        
        if not found:
            missing_required.append(req_col)
    
    if missing_required:
        errors.append(f"Missing required columns: {', '.join(missing_required)}")
    
    max_day = detect_max_days(df)
    
    # Check what day-specific columns are missing
    expected_day_columns = []
    missing_day_columns = []
    
    for day in range(1, max_day + 1):
        patterns = get_column_name_patterns(day)
        
        for col_type, possible_names in patterns.items():
            expected_col = f'{col_type.replace("_", " ").title()} (Day {day})'
            found = any(name in df.columns for name in possible_names)
            expected_day_columns.append(expected_col)
            if not found:
                missing_day_columns.append(expected_col)
    
    if missing_day_columns:
        warnings.append(f"Some day-specific columns are missing: {', '.join(missing_day_columns[:3])}{'...' if len(missing_day_columns) > 3 else ''}")
    
    # Make sure we have actual data
    if df.empty:
        errors.append("Excel file contains no data rows")
    elif len(df) < 1:
        errors.append("Excel file must contain at least one product row")
    
    # Warn about large files that might be slow
    if len(df) > 1000:
        warnings.append(f"Large dataset detected ({len(df)} rows). Processing may take longer.")
    
    # Sanity check on day numbers
    if max_day > 365:
        warnings.append(f"Detected {max_day} days - this seems unusually high. Please verify your column names.")
    elif max_day > 30:
        warnings.append(f"Detected {max_day} days of data.")
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'max_days': max_day,
        'total_rows': len(df),
        'expected_columns': len(expected_day_columns) + len(required_columns),
        'columns_found': len(df.columns) if not df.empty else 0
    }

def parse_excel_data(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Extract product data from Excel rows"""
    products = []
    
    for _, row in df.iterrows():
        # Get basic product info - try different column name formats
        product_id = ''
        product_name = ''
        opening_inventory = 0
        
        # Look for ID in different formats
        for id_col in ['ID', 'Product ID', 'ProductID', 'id', 'product_id']:
            if id_col in row and not pd.isna(row[id_col]):
                product_id = str(row[id_col])
                break
        
        # Look for name in different formats
        for name_col in ['Product Name', 'ProductName', 'Name', 'product_name', 'name']:
            if name_col in row and not pd.isna(row[name_col]):
                product_name = str(row[name_col])
                break
                
        # Look for inventory in different formats
        for inv_col in ['Opening Inventory', 'Opening Inventory on Day 1', 'opening_inventory', 'OpeningInventory']:
            if inv_col in row and not pd.isna(row[inv_col]):
                opening_inventory = int(float(row[inv_col]))
                break
        
        # Skip rows without a product ID
        if not product_id or product_id == 'nan':
            continue
            
        # Now get the day-by-day data
        procurement_data = []
        sales_data = []
        
        max_days = detect_max_days(df)
        
        # Go through each day and extract the data
        for day in range(1, max_days + 1):
            patterns = get_column_name_patterns(day)
            
            proc_qty = 0
            proc_price = 0.0
            sales_qty = 0
            sales_price = 0.0
            
            # Try different column names for procurement quantity
            for col in patterns['procurement_qty']:
                if col in row and not pd.isna(row[col]):
                    proc_qty = int(float(row[col]))
                    break
                    
            # Same for procurement price
            for col in patterns['procurement_price']:
                if col in row and not pd.isna(row[col]):
                    proc_price = clean_currency_value(row[col])
                    break
                    
            # And sales quantity
            for col in patterns['sales_qty']:
                if col in row and not pd.isna(row[col]):
                    sales_qty = int(float(row[col]))
                    break
                    
            # And sales price
            for col in patterns['sales_price']:
                if col in row and not pd.isna(row[col]):
                    sales_price = clean_currency_value(row[col])
                    break
            
            procurement_data.append({
                'day': day,
                'quantity': proc_qty,
                'price': proc_price,
                'amount': proc_qty * proc_price
            })
            
            sales_data.append({
                'day': day,
                'quantity': sales_qty,
                'price': sales_price,
                'amount': sales_qty * sales_price
            })
        
        products.append({
            'product_id': product_id,
            'name': product_name,
            'opening_inventory': opening_inventory,
            'procurement_data': procurement_data,
            'sales_data': sales_data
        })
    
    return products

@router.post("/excel", response_model=ExcelUploadResponse)
async def upload_excel(
    db: DB,
    current_user: CurrentUser,
    file: UploadFile = File(...)
):
    # Validate file type
    if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a valid Excel file (.xlsx or .xls)"
        )
    
    # Check file size (limit to 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    try:
        # Read Excel file
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # Create upload record
        upload_record = ExcelUpload(
            user_id=current_user.id,
            filename=file.filename,
            status="processing"
        )
        db.add(upload_record)
        db.commit()
        db.refresh(upload_record)
        
        # Validate Excel format first
        validation_result = validate_excel_format(df)
        
        if not validation_result['is_valid']:
            upload_record.status = "failed"
            db.commit()
            error_details = {
                "message": "Excel file format validation failed",
                "errors": validation_result['errors'],
                "warnings": validation_result['warnings']
            }
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_details
            )
        
        # Parse Excel data
        products_data = parse_excel_data(df)
        
        if not products_data:
            upload_record.status = "failed"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "No valid product data found in Excel file",
                    "errors": ["File contains no processable product data"],
                    "warnings": []
                }
            )
        
        # Save products to database
        products_processed = 0
        
        for product_data in products_data:
            # Check if product already exists for this user
            statement = select(Product).where(
                Product.user_id == current_user.id,
                Product.product_id == product_data['product_id']
            )
            existing_product = db.exec(statement).first()
            
            if existing_product:
                # Update existing product
                existing_product.name = product_data['name']
                existing_product.opening_inventory = product_data['opening_inventory']
                existing_product.updated_at = datetime.now(UTC)
                
                # Delete existing data
                proc_to_delete = db.exec(select(ProcurementData).where(ProcurementData.product_id == existing_product.id)).all()
                for proc in proc_to_delete:
                    db.delete(proc)
                
                sales_to_delete = db.exec(select(SalesData).where(SalesData.product_id == existing_product.id)).all()
                for sale in sales_to_delete:
                    db.delete(sale)
                
                db_product = existing_product
            else:
                # Create new product
                db_product = Product(
                    user_id=current_user.id,
                    product_id=product_data['product_id'],
                    name=product_data['name'],
                    opening_inventory=product_data['opening_inventory']
                )
                db.add(db_product)
            
            db.commit()
            db.refresh(db_product)
            
            # Add procurement data
            for proc_data in product_data['procurement_data']:
                if proc_data['quantity'] > 0 or proc_data['price'] > 0:
                    procurement = ProcurementData(
                        product_id=db_product.id,
                        day=proc_data['day'],
                        quantity=proc_data['quantity'],
                        price=proc_data['price'],
                        amount=proc_data['amount']
                    )
                    db.add(procurement)
            
            # Add sales data
            for sales_data in product_data['sales_data']:
                if sales_data['quantity'] > 0 or sales_data['price'] > 0:
                    sales = SalesData(
                        product_id=db_product.id,
                        day=sales_data['day'],
                        quantity=sales_data['quantity'],
                        price=sales_data['price'],
                        amount=sales_data['amount']
                    )
                    db.add(sales)
            
            products_processed += 1
        
        db.commit()
        
        # Update upload status
        upload_record.status = "completed"
        db.commit()
        
        return ExcelUploadResponse(
            message="Excel file processed successfully",
            upload_id=str(upload_record.id),
            products_processed=products_processed,
            status="completed",
            validation_info={
                "max_days_detected": validation_result['max_days'],
                "total_rows": validation_result['total_rows'],
                "warnings": validation_result['warnings']
            }
        )
        
    except pd.errors.ParserError:
        if 'upload_record' in locals():
            upload_record.status = "failed"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Excel file format. Please check your file and try again."
        )
    except Exception as e:
        if 'upload_record' in locals():
            upload_record.status = "failed"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing Excel file: {str(e)}"
        )

@router.get("/products", response_model=ProductListResponse)
async def get_user_products(
    db: DB,
    current_user: CurrentUser
):
    """Get all products for the current user"""
    statement = select(Product).where(Product.user_id == current_user.id)
    products = db.exec(statement).all()
    
    product_responses = []
    
    for product in products:
        # Get procurement data
        proc_statement = select(ProcurementData).where(ProcurementData.product_id == product.id)
        procurement_data = db.exec(proc_statement).all()
        
        # Get sales data
        sales_statement = select(SalesData).where(SalesData.product_id == product.id)
        sales_data = db.exec(sales_statement).all()
        
        product_responses.append(ProductDataResponse(
            id=str(product.id),
            product_id=product.product_id,
            name=product.name,
            opening_inventory=product.opening_inventory,
            procurement_data=[{
                'day': p.day,
                'quantity': p.quantity,
                'price': p.price,
                'amount': p.amount
            } for p in procurement_data],
            sales_data=[{
                'day': s.day,
                'quantity': s.quantity,
                'price': s.price,
                'amount': s.amount
            } for s in sales_data]
        ))
    
    return ProductListResponse(
        products=product_responses,
        total=len(product_responses)
    )