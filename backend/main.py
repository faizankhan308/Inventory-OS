import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, SessionLocal, init_db_and_seed, DBProduct, DBCustomer, DBOrder, DBOrderItem, DBInventoryTransaction

# Initialize database schemas
init_db_and_seed()

app = FastAPI(
    title="Inventory & Order Management REST API",
    description="Python FastAPI backend communicating with high performance PostgreSQL instances.",
    version="1.0.0"
)

# Enable CORS for react communication redirects
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_stock_movement(db: Session, product_name: str, sku: str, change_qty: int, reason: str, product_id: Optional[str] = None):
    tx = DBInventoryTransaction(
        id=f"tx_{uuid.uuid4().hex[:12]}",
        product_id=product_id,
        product_name=product_name,
        sku=sku,
        change_quantity=change_qty,
        reason=reason
    )
    db.add(tx)

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=2, max_length=50)
    price: float = Field(..., ge=0.0)
    quantity: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=30)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str

    class Config:
        from_attributes = True

class OrderItemInput(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItemInput]

class OrderItemResponse(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    sku: Optional[str] = None
    quantity: int
    price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = "Unknown Customer"
    items: List[OrderItemResponse]
    total_amount: float
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class LowStockProductInfo(BaseModel):
    id: str
    name: str
    sku: str
    quantity: int

    class Config:
        from_attributes = True

class RecentOrderInfo(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = "Unknown Customer"
    total_amount: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    totalProducts: int
    totalCustomers: int
    totalOrders: int
    totalRevenue: float
    lowStockCount: int
    lowStockProducts: List[LowStockProductInfo]
    recentOrders: List[RecentOrderInfo]

class InventoryTransactionResponse(BaseModel):
    id: str
    product_id: Optional[str] = None
    product_name: str
    sku: str
    change_quantity: int
    reason: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# PRODUCT ENDPOINTS
# ==========================================

@app.get("/products", response_model=List[ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(DBProduct).all()

@app.get("/products/{product_id}", response_model=ProductResponse)
def read_product(product_id: str, db: Session = Depends(get_db)):
    db_product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.post("/products", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Validate SKU uniqueness
    existing_sku = db.query(DBProduct).filter(DBProduct.sku == product.sku.upper()).first()
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product SKU/code must be unique"
        )
    
    db_product = DBProduct(
        id="p_" + uuid.uuid4().hex[:10],
        name=product.name.strip(),
        sku=product.sku.upper().strip(),
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    
    # Log initial stock movement
    log_stock_movement(
        db,
        product_name=db_product.name,
        sku=db_product.sku,
        change_qty=db_product.quantity,
        reason="Initial Stock",
        product_id=db_product.id
    )
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check SKU uniqueness excluding current product
    existing_sku = db.query(DBProduct).filter(
        DBProduct.sku == product.sku.upper(), DBProduct.id != product_id
    ).first()
    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another product already uses this SKU"
        )
    
    # Calculate stock quantity difference
    diff = product.quantity - db_product.quantity
    
    db_product.name = product.name.strip()
    db_product.sku = product.sku.upper().strip()
    db_product.price = product.price
    db_product.quantity = product.quantity
    
    # Log stock transaction if quantity changed
    if diff != 0:
        log_stock_movement(
            db,
            product_name=db_product.name,
            sku=db_product.sku,
            change_qty=diff,
            reason="Manual Adjustment",
            product_id=db_product.id
        )
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    from sqlalchemy.exc import IntegrityError
    db_product = db.query(DBProduct).filter(DBProduct.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Log stock removal due to product deletion
        log_stock_movement(
            db,
            product_name=db_product.name,
            sku=db_product.sku,
            change_qty=-db_product.quantity,
            reason="Product Deleted",
            product_id=db_product.id
        )
        db.delete(db_product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this product because it is referenced in an active order. Please delete the associated orders first."
        )
    return {"message": "Product successfully deleted"}


# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================

@app.get("/customers", response_model=List[CustomerResponse])
def read_customers(db: Session = Depends(get_db)):
    return db.query(DBCustomer).all()

@app.get("/customers/{customer_id}", response_model=CustomerResponse)
def read_customer(customer_id: str, db: Session = Depends(get_db)):
    db_customer = db.query(DBCustomer).filter(DBCustomer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.post("/customers", response_model=CustomerResponse, status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    # Validate Customer email constraint
    existing_email = db.query(DBCustomer).filter(DBCustomer.email == customer.email.lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer email must be unique"
        )
    
    db_customer = DBCustomer(
        id="c_" + uuid.uuid4().hex[:10],
        name=customer.name.strip(),
        email=customer.email.lower().strip(),
        phone=customer.phone.strip()
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    db_customer = db.query(DBCustomer).filter(DBCustomer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer successfully unlinked"}


# ==========================================
# ORDER ENDPOINTS
# ==========================================

@app.get("/orders", response_model=List[OrderResponse])
def read_orders(db: Session = Depends(get_db)):
    orders = db.query(DBOrder).order_by(DBOrder.created_at.desc()).all()
    results = []
    
    for order in orders:
        cust = db.query(DBCustomer).filter(DBCustomer.id == order.customer_id).first()
        cust_name = cust.name if cust else "Legacy Account"
        
        results.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_name": cust_name,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "items": order.items
        })
    return results

@app.get("/orders/{order_id}", response_model=OrderResponse)
def read_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    cust = db.query(DBCustomer).filter(DBCustomer.id == order.customer_id).first()
    cust_name = cust.name if cust else "Legacy Account"
    
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": cust_name,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items": order.items
    }

@app.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer details
    customer = db.query(DBCustomer).filter(DBCustomer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer target reference not found")
        
    total_amount = 0.0
    items_to_save = []
    
    # Process within an atomic try block
    try:
        for item in payload.items:
            product = db.query(DBProduct).filter(DBProduct.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product with ID '{item.product_id}' not found")
                
            if product.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Orders cannot be placed if inventory is insufficient (Product '{product.name}' has {product.quantity} left)"
                )
            
            # Deduct stock immediately
            product.quantity -= item.quantity
            item_cost = product.price * item.quantity
            total_amount += item_cost
            
            db_item = DBOrderItem(
                id="oi_" + uuid.uuid4().hex[:10],
                product_id=product.id,
                product_name=product.name,
                sku=product.sku,
                quantity=item.quantity,
                price=product.price
            )
            items_to_save.append(db_item)
            
        order_id = "o_" + uuid.uuid4().hex[:10]
        db_order = DBOrder(
            id=order_id,
            customer_id=payload.customer_id,
            total_amount=round(total_amount, 2),
            status="Completed"
        )
        
        db.add(db_order)
        
        for saving_item in items_to_save:
            saving_item.order_id = order_id
            db.add(saving_item)
            
            # Log stock deduction due to order checkout
            log_stock_movement(
                db,
                product_name=saving_item.product_name,
                sku=saving_item.sku,
                change_qty=-saving_item.quantity,
                reason=f"Order Placed (ID: {order_id})",
                product_id=saving_item.product_id
            )
            
        db.commit()
        db.refresh(db_order)
        
        return {
            "id": db_order.id,
            "customer_id": db_order.customer_id,
            "customer_name": customer.name,
            "total_amount": db_order.total_amount,
            "status": db_order.status,
            "created_at": db_order.created_at,
            "items": db_order.items
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to compile checkout state: {e}")

@app.delete("/orders/{order_id}")
def delete_order(order_id: str, db: Session = Depends(get_db)):
    db_order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Restock products before cancelling
    if db_order.status != "Cancelled":
        for item in db_order.items:
            product = db.query(DBProduct).filter(DBProduct.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
                
            # Log stock replenishment due to order cancellation
            log_stock_movement(
                db,
                product_name=item.product_name,
                sku=item.sku,
                change_qty=item.quantity,
                reason=f"Order Cancelled (ID: {order_id})",
                product_id=item.product_id
            )
                
    db.delete(db_order)
    db.commit()
    return {"message": "Order transaction successfully cancelled and quantities refilled."}

# ==========================================
# SYSTEM TELEMETRY / DASHBOARD ENDPOINT
# ==========================================

@app.get("/dashboard-stats", response_model=DashboardStatsResponse)
def read_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Core aggregates
    total_products = db.query(DBProduct).count()
    total_customers = db.query(DBCustomer).count()
    total_orders = db.query(DBOrder).count()
    
    # 2. Total revenue sum across all completed transactions
    total_revenue_query = db.query(func.sum(DBOrder.total_amount)).scalar()
    total_revenue = float(total_revenue_query) if total_revenue_query is not None else 0.0
    
    # 3. Low stock threshold (quantity <= 5 items in Postgres)
    low_stock_query = db.query(DBProduct).filter(DBProduct.quantity <= 5)
    low_stock_count = low_stock_query.count()
    low_stock_products = low_stock_query.all()
    
    # 4. Compile top 5 most recent orders with full customer reference mapping
    recent_orders_db = db.query(DBOrder).order_by(DBOrder.created_at.desc()).limit(5).all()
    recent_orders = []
    
    for order in recent_orders_db:
        cust = db.query(DBCustomer).filter(DBCustomer.id == order.customer_id).first()
        cust_name = cust.name if cust else "Unknown Customer"
        
        recent_orders.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_name": cust_name,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "items": order.items
        })
        
    return {
        "totalProducts": total_products,
        "totalCustomers": total_customers,
        "totalOrders": total_orders,
        "totalRevenue": round(total_revenue, 2),
        "lowStockCount": low_stock_count,
        "lowStockProducts": low_stock_products,
        "recentOrders": recent_orders
    }

# ==========================================
# INVENTORY TRANSACTION ENDPOINTS
# ==========================================

@app.get("/inventory-transactions", response_model=List[InventoryTransactionResponse])
def read_inventory_transactions(db: Session = Depends(get_db)):
    return db.query(DBInventoryTransaction).order_by(DBInventoryTransaction.created_at.desc()).all()
