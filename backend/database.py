import os
import datetime
from sqlalchemy import create_engine, Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres_secure_key@db:5432/inventory_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBProduct(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)

class DBCustomer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)

class DBOrder(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="Completed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    items = relationship("DBOrderItem", back_populates="order", cascade="all, delete-orphan")

class DBOrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name = Column(String, nullable=True)
    sku = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("DBOrder", back_populates="items")

class DBInventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, nullable=True)
    product_name = Column(String, nullable=False)
    sku = Column(String, nullable=False)
    change_quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db_and_seed():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    
    # Check if empty, then seed
    db = SessionLocal()
    try:
        if db.query(DBProduct).count() == 0:
            # Seed Products
            p1 = DBProduct(id="p1", name="Alloy Tech Mechanical Keyboard", sku="KB-MECH-87", price=129.99, quantity=45)
            p2 = DBProduct(id="p2", name="Ergonomic Mesh Office Chair", sku="CHAIR-ERG-02", price=349.50, quantity=4)
            p3 = DBProduct(id="p3", name="UltraWide 34-inch Curved Monitor", sku="MON-34UW-IPS", price=599.99, quantity=12)
            p4 = DBProduct(id="p4", name="Thunderbolt 4 Docking Station", sku="DOCK-TB4-PRO", price=189.00, quantity=3)
            p5 = DBProduct(id="p5", name="Noise Cancelling Studio Earbuds", sku="EAR-ANC-05", price=89.95, quantity=60)
            db.add_all([p1, p2, p3, p4, p5])
            db.commit()

        if db.query(DBCustomer).count() == 0:
            # Seed Customers
            c1 = DBCustomer(id="c1", name="Sarah Jenkins", email="sarah.j@example.com", phone="+1 (555) 234-5678")
            c2 = DBCustomer(id="c2", name="Marcus Chen", email="marcus.chen@example.com", phone="+1 (555) 987-6543")
            c3 = DBCustomer(id="c3", name="Elena Rostova", email="elena.r@example.com", phone="+1 (555) 456-7890")
            db.add_all([c1, c2, c3])
            db.commit()

        if db.query(DBOrder).count() == 0:
            # Seed Orders
            order_id = "o1"
            o1 = DBOrder(id=order_id, customer_id="c1", total_amount=318.99, created_at=datetime.datetime.utcnow())
            item1 = DBOrderItem(id="oi1", order_id=order_id, product_id="p4", product_name="Thunderbolt 4 Docking Station", sku="DOCK-TB4-PRO", quantity=1, price=189.00)
            item2 = DBOrderItem(id="oi2", order_id=order_id, product_id="p1", product_name="Alloy Tech Mechanical Keyboard", sku="KB-MECH-87", quantity=1, price=129.99)
            db.add_all([o1, item1, item2])
            db.commit()

        if db.query(DBInventoryTransaction).count() == 0:
            # Seed Initial Transactions for Products
            tx1 = DBInventoryTransaction(id="tx_s1", product_id="p1", product_name="Alloy Tech Mechanical Keyboard", sku="KB-MECH-87", change_quantity=46, reason="Initial Stock")
            tx2 = DBInventoryTransaction(id="tx_s2", product_id="p2", product_name="Ergonomic Mesh Office Chair", sku="CHAIR-ERG-02", change_quantity=4, reason="Initial Stock")
            tx3 = DBInventoryTransaction(id="tx_s3", product_id="p3", product_name="UltraWide 34-inch Curved Monitor", sku="MON-34UW-IPS", change_quantity=12, reason="Initial Stock")
            tx4 = DBInventoryTransaction(id="tx_s4", product_id="p4", product_name="Thunderbolt 4 Docking Station", sku="DOCK-TB4-PRO", change_quantity=4, reason="Initial Stock")
            tx5 = DBInventoryTransaction(id="tx_s5", product_id="p5", product_name="Noise Cancelling Studio Earbuds", sku="EAR-ANC-05", change_quantity=60, reason="Initial Stock")
            
            # Seed transaction deductions for Order o1
            tx6 = DBInventoryTransaction(id="tx_s6", product_id="p4", product_name="Thunderbolt 4 Docking Station", sku="DOCK-TB4-PRO", change_quantity=-1, reason="Order Placed (ID: o1)")
            tx7 = DBInventoryTransaction(id="tx_s7", product_id="p1", product_name="Alloy Tech Mechanical Keyboard", sku="KB-MECH-87", change_quantity=-1, reason="Order Placed (ID: o1)")
            
            db.add_all([tx1, tx2, tx3, tx4, tx5, tx6, tx7])
            db.commit()
    except Exception as e:
        print(f"Db seeding log indicator error: {e}")
        db.rollback()
    finally:
        db.close()
