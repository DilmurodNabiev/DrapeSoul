from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class ProductSizeStockSchema(BaseModel):
    size: str
    stock: int

    model_config = {"from_attributes": True}


class ProductImageSchema(BaseModel):
    id: int
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False

    model_config = {"from_attributes": True}


class ProductListItem(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    is_featured: bool
    is_new_arrival: bool
    is_best_seller: bool
    category_slug: Optional[str] = None
    primary_image: Optional[str] = None
    in_stock: bool = True

    model_config = {"from_attributes": True}


class AdminProductListItem(ProductListItem):
    description: Optional[str] = None
    category_id: Optional[int] = None
    is_active: bool = True
    size_stocks: List[ProductSizeStockSchema] = Field(default_factory=list)


class ProductDetail(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    is_featured: bool
    is_new_arrival: bool
    is_best_seller: bool
    category_id: Optional[int] = None
    category_slug: Optional[str] = None
    category_name: Optional[str] = None
    images: List[ProductImageSchema] = Field(default_factory=list)
    size_stocks: List[ProductSizeStockSchema] = Field(default_factory=list)
    in_stock: bool = True
    view_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    category_id: Optional[int] = None
    is_featured: bool = False
    is_new_arrival: bool = False
    is_best_seller: bool = False
    is_active: bool = True
    size_stocks: List[ProductSizeStockSchema] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    category_id: Optional[int] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    is_active: Optional[bool] = None
    size_stocks: Optional[List[ProductSizeStockSchema]] = None
