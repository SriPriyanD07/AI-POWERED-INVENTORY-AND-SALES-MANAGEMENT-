"""
SmartRetail DA3 — Pydantic Validation & Domain Models
Module: da3_mongodb/src/models.py
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class PaymentItem(BaseModel):
    payment_method: str = Field(..., pattern="^(CASH|CREDIT_CARD|DEBIT_CARD|UPI|WALLET|POINTS)$")
    amount: float = Field(..., gt=0)
    reference_number: Optional[str] = None


class SaleLineItem(BaseModel):
    product_id: int
    shelf_location_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = Field(None, gt=0)


class SaleRequest(BaseModel):
    receipt_number: str
    customer_id: Optional[int] = None
    cashier_id: int
    items: List[SaleLineItem]
    payments: List[PaymentItem]


class StockTransferRequest(BaseModel):
    product_id: int
    from_location_id: int
    to_location_id: int
    quantity: int = Field(..., gt=0)
    employee_id: Optional[int] = None
    triggered_by: str = "MANUAL_REQUEST"


class ReceiveShipmentRequest(BaseModel):
    shipment_id: int
    warehouse_location_id: int
    received_by: int


class CreatePurchaseOrderRequest(BaseModel):
    po_number: str
    supplier_id: int
    created_by: int
    items: List[dict]
    is_auto_generated: bool = False


class ProductCreate(BaseModel):
    sku: str
    barcode: str
    product_name: str
    description: Optional[str] = None
    category_id: int
    unit_of_measure: str = "PACK"
    standard_unit_price: float = Field(..., gt=0)
    is_active: str = "TRUE"


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    unit_of_measure: Optional[str] = None
    standard_unit_price: Optional[float] = Field(None, gt=0)
    is_active: Optional[str] = None


class SupplierCreate(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    gst_number: str
    phone_numbers: List[str] = []
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)


class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    gst_number: Optional[str] = None
    phone_numbers: Optional[List[str]] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)


class StockThresholdUpdate(BaseModel):
    reorder_threshold: int = Field(..., ge=0)
    reorder_quantity: int = Field(..., gt=0)


class PurchaseOrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(DRAFT|PENDING|APPROVED|SHIPPED|PARTIALLY_RECEIVED|COMPLETED|CANCELLED)$")

