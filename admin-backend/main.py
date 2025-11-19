
# # admin-backend/main.py - COMPLETE UPDATED VERSION WITH PRODUCT MANAGEMENT
# from fastapi import FastAPI, Depends, HTTPException, Header, Request, UploadFile, File, Form
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import FileResponse
# from fastapi.staticfiles import StaticFiles
# from pydantic import BaseModel
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker, Session
# from dotenv import load_dotenv
# from typing import Dict, Any, List, Optional
# import os
# import random
# import uuid

# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")
# ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
# ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
# ADMIN_PANEL_TOKEN = os.getenv("ADMIN_PANEL_TOKEN")
# FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# if not DATABASE_URL:
#     raise RuntimeError("DATABASE_URL is not set in .env")

# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# app = FastAPI(title="Admin API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ADD PRODUCTS TO ALLOWED TABLES
# ALLOWED_TABLES = [
#     "users",
#     "cart",
#     "wishlist",
#     "order_items",
#     "orders",
#     "wallets",
#     "wallet_transactions",
#     "lucky_draw_tickets",
#     "bill_uploads",
#     "schemes",
#     "lucky_draw_master",
#     "products",  # NEW TABLE
# ]

# class LoginRequest(BaseModel):
#     username: str
#     password: str

# class LoginResponse(BaseModel):
#     token: str

# class UpdateRowRequest(BaseModel):
#     data: Dict[str, Any]

# class SelectWinnerRequest(BaseModel):
#     ticket_id: int

# class ApproveCashbackRequest(BaseModel):
#     cashback_amount: float

# # CREATE PRODUCTS TABLE IF NOT EXISTS
# def create_products_table(db: Session):
#     try:
#         # Check if products table exists
#         check_table_query = text("""
#             SELECT EXISTS (
#                 SELECT FROM information_schema.tables 
#                 WHERE table_name = 'products'
#             );
#         """)
#         table_exists = db.execute(check_table_query).scalar()
        
#         if not table_exists:
#             # Create products table
#             create_table_query = text("""
#                 CREATE TABLE products (
#                     id SERIAL PRIMARY KEY,
#                     name VARCHAR(255) NOT NULL,
#                     description TEXT,
#                     price DECIMAL(10,2) NOT NULL,
#                     old_price DECIMAL(10,2),
#                     image_url VARCHAR(500) NOT NULL,
#                     category VARCHAR(100) NOT NULL,
#                     brand VARCHAR(100) NOT NULL,
#                     rating DECIMAL(3,2) DEFAULT 0.0,
#                     stock_quantity INTEGER DEFAULT 0,
#                     is_featured BOOLEAN DEFAULT FALSE,
#                     status VARCHAR(20) DEFAULT 'active',
#                     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
#                     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
#                 );
#             """)
#             db.execute(create_table_query)
#             db.commit()
#             print("🟦 Products table created successfully")
#         else:
#             print("🟦 Products table already exists")
            
#     except Exception as e:
#         print(f"🟥 Error creating products table: {e}")
#         db.rollback()

# # CREATE UPLOADS DIRECTORY FOR PRODUCT IMAGES
# PRODUCT_UPLOADS_DIR = "uploads/products"
# os.makedirs(PRODUCT_UPLOADS_DIR, exist_ok=True)

# # Mount static files for product images
# app.mount("/static/products", StaticFiles(directory=PRODUCT_UPLOADS_DIR), name="product_images")

# def verify_admin(token: str = Header(..., alias="X-Admin-Token")):
#     if token != ADMIN_PANEL_TOKEN:
#         raise HTTPException(status_code=401, detail="Invalid admin token")

# def ensure_table_allowed(table_name: str):
#     if table_name not in ALLOWED_TABLES:
#         raise HTTPException(status_code=400, detail="Table not allowed")

# # UPDATED: Correct path to user backend uploads
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# USER_BACKEND_UPLOADS = os.path.abspath(os.path.join(BASE_DIR, "..", "Ecommerce", "backend", "uploads", "bills"))

# # Create directory if it doesn't exist
# os.makedirs(USER_BACKEND_UPLOADS, exist_ok=True)

# print(f"🟦 Looking for images in: {USER_BACKEND_UPLOADS}")

# # INITIALIZE PRODUCTS TABLE ON STARTUP
# @app.on_event("startup")
# def startup_event():
#     db = SessionLocal()
#     try:
#         create_products_table(db)
#     finally:
#         db.close()

# @app.post("/admin/login", response_model=LoginResponse)
# def admin_login(body: LoginRequest):
#     if body.username == ADMIN_USERNAME and body.password == ADMIN_PASSWORD:
#         return LoginResponse(token=ADMIN_PANEL_TOKEN)
#     raise HTTPException(status_code=401, detail="Invalid credentials")

# @app.get("/admin/tables")
# def get_tables(_: str = Depends(verify_admin)):
#     return {"tables": ALLOWED_TABLES}

# @app.get("/admin/table/{table_name}")
# def get_table_data(
#     table_name: str,
#     limit: int = 100,
#     offset: int = 0,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     ensure_table_allowed(table_name)
#     query = text(f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT :limit OFFSET :offset")
#     result = db.execute(query, {"limit": limit, "offset": offset})
#     rows = [dict(row) for row in result.mappings()]
#     return {"rows": rows}

# @app.get("/admin/table/{table_name}/{row_id}")
# def get_single_row(
#     table_name: str,
#     row_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     ensure_table_allowed(table_name)
#     query = text(f"SELECT * FROM {table_name} WHERE id = :id")
#     row = db.execute(query, {"id": row_id}).mappings().first()
#     if not row:
#         raise HTTPException(status_code=404, detail="Row not found")
#     return {"row": dict(row)}

# # UPDATED CREATE ROW TO HANDLE PRODUCT IMAGES
# @app.post("/admin/table/{table_name}")
# async def create_row(
#     table_name: str,
#     request: Request,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     ensure_table_allowed(table_name)

#     # Check if it's a multipart form (for product image upload)
#     content_type = request.headers.get("content-type", "")
    
#     if "multipart/form-data" in content_type and table_name == "products":
#         return await create_product_with_image(request, db)
#     else:
#         # Original JSON handling for other tables
#         body = await request.json()
#         if not body.get("data"):
#             raise HTTPException(status_code=400, detail="No fields provided")

#         data = body["data"]
#         columns = ", ".join(data.keys())
#         values = ", ".join([f":{col}" for col in data.keys()])

#         query = text(f"INSERT INTO {table_name} ({columns}) VALUES ({values})")

#         try:
#             db.execute(query, data)
#             db.commit()
#             return {"status": "created"}
#         except Exception as e:
#             db.rollback()
#             raise HTTPException(status_code=500, detail=str(e))

# # NEW: HANDLE PRODUCT CREATION WITH IMAGE UPLOAD
# async def create_product_with_image(request: Request, db: Session):
#     try:
#         form_data = await request.form()
        
#         # Extract product data from form
#         product_data = {
#             "name": form_data.get("name"),
#             "description": form_data.get("description"),
#             "price": float(form_data.get("price", 0)),
#             "old_price": float(form_data.get("old_price", 0)) if form_data.get("old_price") else None,
#             "category": form_data.get("category"),
#             "brand": form_data.get("brand"),
#             "stock_quantity": int(form_data.get("stock_quantity", 0)),
#             "is_featured": form_data.get("is_featured", "false").lower() == "true",
#             "status": form_data.get("status", "active")
#         }
        
#         # Handle image upload
#         image_file = form_data.get("image")
#         if not image_file or not hasattr(image_file, "filename") or not image_file.filename:
#             raise HTTPException(status_code=400, detail="Product image is required")
        
#         # Generate safe filename (shorter and without special characters)
#         import re
#         # Clean and shorten product name and brand
#         clean_name = re.sub(r'[^\w\s-]', '', product_data['name']).strip()[:30]  # Limit to 30 chars
#         clean_brand = re.sub(r'[^\w\s-]', '', product_data['brand']).strip()[:20]  # Limit to 20 chars
#         clean_name = re.sub(r'[-\s]+', '_', clean_name)
#         clean_brand = re.sub(r'[-\s]+', '_', clean_brand)
        
#         # Get file extension safely
#         filename = image_file.filename
#         file_extension = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
#         if file_extension not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
#             file_extension = 'jpg'
        
#         unique_id = uuid.uuid4().hex[:8]
#         unique_filename = f"{clean_brand}_{clean_name}_{unique_id}.{file_extension}"
#         image_path = os.path.join(PRODUCT_UPLOADS_DIR, unique_filename)
        
#         # Ensure directory exists
#         os.makedirs(PRODUCT_UPLOADS_DIR, exist_ok=True)
        
#         print(f"🟦 Saving image to: {image_path}")  # Debug log
        
#         # Save image file
#         content = await image_file.read()
#         with open(image_path, "wb") as buffer:
#             buffer.write(content)
        
#         # Add image URL to product data (use forward slashes for URLs)
#         product_data["image_url"] = f"/static/products/{unique_filename}"
        
#         # Insert into database
#         columns = ", ".join(product_data.keys())
#         values = ", ".join([f":{col}" for col in product_data.keys()])
        
#         query = text(f"INSERT INTO products ({columns}) VALUES ({values}) RETURNING id")
        
#         try:
#             result = db.execute(query, product_data)
#             new_product_id = result.scalar()
#             db.commit()
            
#             print(f"🟦 Product created with ID: {new_product_id}")  # Debug log
            
#             return {
#                 "status": "created", 
#                 "message": "Product created successfully",
#                 "product_id": new_product_id
#             }
#         except Exception as e:
#             # Delete uploaded image if database operation fails
#             if os.path.exists(image_path):
#                 os.remove(image_path)
#             db.rollback()
#             print(f"🟥 Database error: {e}")  # Debug log
#             raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"🟥 Error processing form data: {e}")  # Debug log
#         raise HTTPException(status_code=500, detail=f"Error processing form data: {str(e)}")

# @app.put("/admin/table/{table_name}/{row_id}")
# def update_row(
#     table_name: str,
#     row_id: int,
#     body: UpdateRowRequest,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     ensure_table_allowed(table_name)

#     if "id" in body.data:
#         body.data.pop("id")

#     if not body.data:
#         raise HTTPException(status_code=400, detail="No fields to update")

#     set_clause = ", ".join([f"{col} = :{col}" for col in body.data.keys()])
#     params = body.data.copy()
#     params["id"] = row_id

#     query = text(f"UPDATE {table_name} SET {set_clause} WHERE id = :id")

#     result = db.execute(query, params)
#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Row not found")

#     db.commit()
#     return {"status": "ok"}

# @app.delete("/admin/table/{table_name}/{row_id}")
# def delete_row(
#     table_name: str,
#     row_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     ensure_table_allowed(table_name)

#     query = text(f"DELETE FROM {table_name} WHERE id = :id")
#     result = db.execute(query, {"id": row_id})

#     if result.rowcount == 0:
#         raise HTTPException(status_code=404, detail="Row not found")

#     db.commit()
#     return {"status": "deleted"}

# # NEW: GET PRODUCTS FOR USER APP
# # NEW: GET PRODUCTS FOR USER APP - WITH IMAGE VALIDATION
# @app.get("/api/products")
# def get_products(
#     category: Optional[str] = None,
#     brand: Optional[str] = None,
#     featured: Optional[bool] = None,
#     limit: int = 100,
#     offset: int = 0,
#     db: Session = Depends(get_db)
# ):
#     try:
#         base_query = "SELECT * FROM products WHERE status = 'active'"
#         params = {"limit": limit, "offset": offset}
        
#         if category:
#             base_query += " AND category = :category"
#             params["category"] = category
            
#         if brand:
#             base_query += " AND brand = :brand"
#             params["brand"] = brand
            
#         if featured is not None:
#             base_query += " AND is_featured = :featured"
#             params["featured"] = featured
        
#         base_query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        
#         query = text(base_query)
#         result = db.execute(query, params)
#         products = [dict(row) for row in result.mappings()]
        
#         # Validate image URLs
#         for product in products:
#             if product.get('image_url') and product['image_url'].startswith('/static/products/'):
#                 filename = product['image_url'].replace('/static/products/', '')
#                 image_path = os.path.join(PRODUCT_UPLOADS_DIR, filename)
#                 if not os.path.exists(image_path):
#                     print(f"🟥 Image not found: {image_path}")
#                     # You can set a default image here if needed
#                     # product['image_url'] = "/static/products/default.jpg"
        
#         return products
        
#     except Exception as e:
#         print(f"🟥 Error fetching products: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # NEW: GET SINGLE PRODUCT
# @app.get("/api/products/{product_id}")
# def get_product(product_id: int, db: Session = Depends(get_db)):
#     try:
#         query = text("SELECT * FROM products WHERE id = :id AND status = 'active'")
#         product = db.execute(query, {"id": product_id}).mappings().first()
        
#         if not product:
#             raise HTTPException(status_code=404, detail="Product not found")
            
#         return dict(product)
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # NEW: GET FEATURED PRODUCTS
# # NEW: GET FEATURED PRODUCTS - FIXED VERSION
# @app.get("/api/products/featured")
# def get_featured_products(db: Session = Depends(get_db)):
#     try:
#         query = text("""
#             SELECT * FROM products 
#             WHERE is_featured = true 
#             AND status = 'active' 
#             ORDER BY created_at DESC 
#             LIMIT 10
#         """)
#         result = db.execute(query)
#         products = [dict(row) for row in result.mappings()]
        
#         return products
        
#     except Exception as e:
#         print(f"🟥 Error fetching featured products: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # NEW: GET PRODUCTS BY CATEGORY
# @app.get("/api/products/category/{category}")
# def get_products_by_category(category: str, db: Session = Depends(get_db)):
#     try:
#         query = text("SELECT * FROM products WHERE category = :category AND status = 'active' ORDER BY created_at DESC")
#         result = db.execute(query, {"category": category})
#         products = [dict(row) for row in result.mappings()]
        
#         return products
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # NEW: GET PRODUCTS BY BRAND
# @app.get("/api/products/brand/{brand}")
# def get_products_by_brand(brand: str, db: Session = Depends(get_db)):
#     try:
#         query = text("SELECT * FROM products WHERE brand = :brand AND status = 'active' ORDER BY created_at DESC")
#         result = db.execute(query, {"brand": brand})
#         products = [dict(row) for row in result.mappings()]
        
#         return products
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # NEW: GET ALL CATEGORIES
# @app.get("/api/categories")
# def get_categories(db: Session = Depends(get_db)):
#     try:
#         query = text("SELECT DISTINCT category FROM products WHERE status = 'active' ORDER BY category")
#         result = db.execute(query)
#         categories = [row["category"] for row in result.mappings()]
        
#         return {"categories": categories}
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # NEW: GET ALL BRANDS
# @app.get("/api/brands")
# def get_brands(db: Session = Depends(get_db)):
#     try:
#         query = text("SELECT DISTINCT brand FROM products WHERE status = 'active' ORDER BY brand")
#         result = db.execute(query)
#         brands = [row["brand"] for row in result.mappings()]
        
#         return {"brands": brands}
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # KEEP ALL YOUR EXISTING ECB AND LUCKY DRAW ENDPOINTS EXACTLY AS THEY WERE
# # PUBLIC IMAGE ENDPOINT (NO AUTH REQUIRED)
# @app.get("/public/ecb/bill-image/{upload_id}")
# async def get_public_bill_image(
#     upload_id: int,
#     db: Session = Depends(get_db),
# ):
#     """Public endpoint for bill images (no authentication required)"""
#     try:
#         # Get bill upload with image filename
#         upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
#         upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
#         if not upload:
#             raise HTTPException(status_code=404, detail="Bill upload not found")
        
#         if not upload["bill_image_path"]:
#             raise HTTPException(status_code=404, detail="No image available")
        
#         filename = upload["bill_image_path"]
        
#         # Check multiple possible locations
#         possible_paths = [
#             os.path.join(USER_BACKEND_UPLOADS, filename),
#             os.path.join("D:/Ecommerce/backend/uploads/bills", filename),
#             os.path.join("../backend/uploads/bills", filename),
#             os.path.join("../../backend/uploads/bills", filename),
#         ]
        
#         file_path = None
#         for path in possible_paths:
#             if os.path.exists(path):
#                 file_path = path
#                 print(f"🟦 Found image at: {file_path}")
#                 break
        
#         if not file_path:
#             raise HTTPException(status_code=404, detail=f"Image file not found. Searched: {filename}")
        
#         # Return the actual image file
#         return FileResponse(
#             file_path, 
#             media_type="image/jpeg",
#             headers={
#                 "Content-Disposition": f"inline; filename={filename}",
#                 "Cache-Control": "public, max-age=3600",
#                 "Access-Control-Allow-Origin": "*",
#             }
#         )
        
#     except Exception as e:
#         print(f"🟥 Error serving public image: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # ADMIN IMAGE ENDPOINT WITH TOKEN SUPPORT
# @app.get("/admin/ecb/bill-image/{upload_id}")
# async def get_bill_image_admin(
#     upload_id: int,
#     request: Request,
#     db: Session = Depends(get_db),
#     token: str = Header(None, alias="X-Admin-Token"),
# ):
#     try:
#         # Flexible token verification
#         if not token:
#             # Check if token is in query parameter (for img tags)
#             token = request.query_params.get("token")
        
#         if not token or token != ADMIN_PANEL_TOKEN:
#             print(f"🟥 Invalid token received")
#             raise HTTPException(status_code=401, detail="Invalid admin token")
        
#         # Get bill upload with image filename
#         upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
#         upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
#         if not upload:
#             raise HTTPException(status_code=404, detail="Bill upload not found")
        
#         if not upload["bill_image_path"]:
#             raise HTTPException(status_code=404, detail="No image available")
        
#         filename = upload["bill_image_path"]
        
#         # Check multiple possible locations
#         possible_paths = [
#             os.path.join(USER_BACKEND_UPLOADS, filename),
#             os.path.join("D:/Ecommerce/backend/uploads/bills", filename),
#             os.path.join("../backend/uploads/bills", filename),
#             os.path.join("../../backend/uploads/bills", filename),
#         ]
        
#         file_path = None
#         for path in possible_paths:
#             if os.path.exists(path):
#                 file_path = path
#                 print(f"🟦 Found image at: {file_path}")
#                 break
        
#         if not file_path:
#             raise HTTPException(status_code=404, detail=f"Image file not found. Searched: {filename}")
        
#         # Return the actual image file
#         return FileResponse(
#             file_path, 
#             media_type="image/jpeg",
#             headers={
#                 "Content-Disposition": f"inline; filename={filename}",
#                 "Cache-Control": "public, max-age=3600",
#                 "Access-Control-Allow-Origin": "*",
#             }
#         )
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"🟥 Error serving image: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # GET BILL IMAGE INFO (for displaying in modal)
# @app.get("/admin/ecb/bill-image-info/{upload_id}")
# def get_bill_image_info(
#     upload_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
#         upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
#         if not upload:
#             raise HTTPException(status_code=404, detail="Bill upload not found")
        
#         filename = upload["bill_image_path"]
        
#         # Check multiple possible locations
#         possible_paths = [
#             os.path.join(USER_BACKEND_UPLOADS, filename),
#             os.path.join("D:/Ecommerce/backend/uploads/bills", filename),
#             os.path.join("../backend/uploads/bills", filename),
#             os.path.join("../../backend/uploads/bills", filename),
#         ]
        
#         file_exists = False
#         actual_path = ""
        
#         for path in possible_paths:
#             if os.path.exists(path):
#                 file_exists = True
#                 actual_path = path
#                 break
        
#         image_url = f"http://localhost:8001/admin/ecb/bill-image/{upload_id}"
#         public_image_url = f"http://localhost:8001/public/ecb/bill-image/{upload_id}"
        
#         return {
#             "upload_id": upload_id,
#             "user_id": upload["user_id"],
#             "ticket_type": upload["ticket_type"],
#             "bill_amount": upload["bill_amount"],
#             "description": upload["description"],
#             "filename": filename,
#             "image_url": image_url,
#             "public_image_url": public_image_url,
#             "file_exists": file_exists,
#             "actual_path": actual_path
#         }
        
#     except Exception as e:
#         print(f"🟥 Error getting image info: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # ECB REPORTS ENDPOINT
# @app.get("/admin/ecb/reports")
# def get_ecb_reports(
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get total bill uploads count
#         total_uploads_query = text("SELECT COUNT(*) as total FROM bill_uploads")
#         total_uploads = db.execute(total_uploads_query).scalar()
        
#         # Get uploads by status
#         status_counts_query = text("""
#             SELECT status, COUNT(*) as count 
#             FROM bill_uploads 
#             GROUP BY status
#         """)
#         status_counts_result = db.execute(status_counts_query)
#         status_counts = {row["status"]: row["count"] for row in status_counts_result.mappings()}
        
#         # Get uploads by ticket type
#         ticket_type_counts_query = text("""
#             SELECT ticket_type, COUNT(*) as count 
#             FROM bill_uploads 
#             GROUP BY ticket_type
#         """)
#         ticket_type_counts_result = db.execute(ticket_type_counts_query)
#         ticket_type_counts = {row["ticket_type"]: row["count"] for row in ticket_type_counts_result.mappings()}
        
#         # Get recent uploads (last 10)
#         recent_uploads_query = text("""
#             SELECT bu.*, u.full_name as user_name
#             FROM bill_uploads bu
#             JOIN users u ON bu.user_id = u.id
#             ORDER BY bu.created_at DESC
#             LIMIT 10
#         """)
#         recent_uploads_result = db.execute(recent_uploads_query)
#         recent_uploads = [dict(row) for row in recent_uploads_result.mappings()]
        
#         # Get total cashback approved
#         cashback_query = text("""
#             SELECT SUM(amount) as total_cashback
#             FROM wallet_transactions
#             WHERE description LIKE '%Cashback approved%'
#         """)
#         total_cashback = db.execute(cashback_query).scalar() or 0
        
#         return {
#             "total_uploads": total_uploads,
#             "status_counts": status_counts,
#             "ticket_type_counts": ticket_type_counts,
#             "recent_uploads": recent_uploads,
#             "total_cashback": float(total_cashback),
#             "report_generated_at": "2024-01-01T00:00:00Z"  # You can use actual datetime here
#         }
        
#     except Exception as e:
#         print(f"🟥 Error generating ECB reports: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # ECB CASHBACK APPROVAL
# @app.post("/admin/ecb/approve-cashback/{upload_id}")
# def approve_cashback(
#     upload_id: int,
#     body: ApproveCashbackRequest,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get bill upload
#         upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
#         upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
#         if not upload:
#             raise HTTPException(status_code=404, detail="Bill upload not found")
        
#         if upload["status"] != "under_review":
#             raise HTTPException(status_code=400, detail="Cashback already processed")
        
#         # Get user's wallet
#         wallet_query = text("SELECT * FROM wallets WHERE user_id = :user_id")
#         wallet = db.execute(wallet_query, {"user_id": upload["user_id"]}).mappings().first()
        
#         if not wallet:
#             # Create wallet if it doesn't exist
#             create_wallet_query = text("INSERT INTO wallets (user_id, main_balance) VALUES (:user_id, 0)")
#             db.execute(create_wallet_query, {"user_id": upload["user_id"]})
#             db.commit()
#             wallet = db.execute(wallet_query, {"user_id": upload["user_id"]}).mappings().first()
        
#         # Add cashback to wallet
#         update_wallet_query = text("""
#             UPDATE wallets 
#             SET main_balance = main_balance + :amount,
#             updated_at = NOW()
#             WHERE user_id = :user_id
#         """)
#         db.execute(update_wallet_query, {"amount": body.cashback_amount, "user_id": upload["user_id"]})
        
#         # Create wallet transaction
#         transaction_query = text("""
#             INSERT INTO wallet_transactions 
#             (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
#             VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'cashback', NOW())
#         """)
#         db.execute(transaction_query, {
#             "user_id": upload["user_id"],
#             "wallet_id": wallet["id"],
#             "amount": body.cashback_amount,
#             "description": f"Cashback approved for {upload['ticket_type']}"
#         })
        
#         # Update upload status
#         update_upload_query = text("""
#             UPDATE bill_uploads 
#             SET status = 'approved',
#             updated_at = NOW()
#             WHERE id = :upload_id
#         """)
#         db.execute(update_upload_query, {"upload_id": upload_id})
        
#         db.commit()
        
#         return {
#             "message": f"Cashback of ₹{body.cashback_amount} approved successfully",
#             "user_id": upload["user_id"],
#             "new_balance": wallet["main_balance"] + body.cashback_amount
#         }
        
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))

# # Lucky Draw endpoints (existing functionality)
# @app.get("/admin/lucky-draws/{draw_id}/participants")
# def get_lucky_draw_participants(
#     draw_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         draw_query = text("SELECT name FROM lucky_draw_master WHERE id = :draw_id")
#         draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
#         if not draw_result:
#             raise HTTPException(status_code=404, detail="Draw not found")

#         draw_name = draw_result["name"]

#         participants_query = text("""
#             SELECT * FROM lucky_draw_tickets 
#             WHERE draw_name = :draw_name 
#             ORDER BY created_at DESC
#         """)
#         participants_result = db.execute(participants_query, {"draw_name": draw_name})
#         participants = [dict(row) for row in participants_result.mappings()]

#         return {
#             "draw_id": draw_id,
#             "draw_name": draw_name,
#             "participants": participants,
#             "total_participants": len(participants)
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/admin/lucky-draws/{draw_id}/select-random-winner")
# def select_random_winner(
#     draw_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         draw_query = text("""
#             SELECT name, prize_amount FROM lucky_draw_master 
#             WHERE id = :draw_id AND winner_selected = false
#         """)
#         draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
#         if not draw_result:
#             raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

#         draw_name = draw_result["name"]
#         prize_amount = draw_result["prize_amount"] or 0

#         participants_query = text("""
#             SELECT * FROM lucky_draw_tickets 
#             WHERE draw_name = :draw_name
#         """)
#         participants_result = db.execute(participants_query, {"draw_name": draw_name})
#         participants = [dict(row) for row in participants_result.mappings()]

#         if not participants:
#             raise HTTPException(status_code=400, detail="No participants for this draw")

#         winner = random.choice(participants)

#         update_draw_query = text("""
#             UPDATE lucky_draw_master 
#             SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
#             WHERE id = :draw_id
#         """)
#         db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

#         update_winner_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET is_winner = true, status = 'won'
#             WHERE id = :ticket_id
#         """)
#         db.execute(update_winner_query, {"ticket_id": winner["id"]})

#         update_losers_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET status = 'lost'
#             WHERE draw_name = :draw_name AND id != :winner_ticket_id
#         """)
#         db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

#         if prize_amount > 0:
#             wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
#             wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
#             if wallet_result:
#                 wallet_id = wallet_result["id"]
                
#                 update_wallet_query = text("""
#                     UPDATE wallets 
#                     SET main_balance = main_balance + :prize_amount,
#                     updated_at = NOW()
#                     WHERE id = :wallet_id
#                 """)
#                 db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

#                 transaction_query = text("""
#                     INSERT INTO wallet_transactions 
#                     (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
#                     VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'prize', NOW())
#                 """)
#                 db.execute(transaction_query, {
#                     "user_id": winner["user_id"],
#                     "wallet_id": wallet_id,
#                     "amount": prize_amount,
#                     "description": f"Lucky Draw Prize: {draw_name}"
#                 })

#         db.commit()

#         return {
#             "message": "Winner selected successfully!",
#             "winner": winner,
#             "prize_amount": prize_amount
#         }

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/admin/lucky-draws/{draw_id}/select-winner-manual")
# def select_manual_winner(
#     draw_id: int,
#     body: SelectWinnerRequest,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         draw_query = text("""
#             SELECT name, prize_amount FROM lucky_draw_master 
#             WHERE id = :draw_id AND winner_selected = false
#         """)
#         draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
#         if not draw_result:
#             raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

#         draw_name = draw_result["name"]
#         prize_amount = draw_result["prize_amount"] or 0

#         winner_query = text("""
#             SELECT * FROM lucky_draw_tickets 
#             WHERE id = :ticket_id AND draw_name = :draw_name
#         """)
#         winner_result = db.execute(winner_query, {"ticket_id": body.ticket_id, "draw_name": draw_name}).mappings().first()

#         if not winner_result:
#             raise HTTPException(status_code=404, detail="Ticket not found for this draw")

#         winner = dict(winner_result)

#         update_draw_query = text("""
#             UPDATE lucky_draw_master 
#             SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
#             WHERE id = :draw_id
#         """)
#         db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

#         update_winner_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET is_winner = true, status = 'won'
#             WHERE id = :ticket_id
#         """)
#         db.execute(update_winner_query, {"ticket_id": winner["id"]})

#         update_losers_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET status = 'lost'
#             WHERE draw_name = :draw_name AND id != :winner_ticket_id
#         """)
#         db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

#         if prize_amount > 0:
#             wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
#             wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
#             if wallet_result:
#                 wallet_id = wallet_result["id"]
                
#                 update_wallet_query = text("""
#                     UPDATE wallets 
#                     SET main_balance = main_balance + :prize_amount,
#                     updated_at = NOW()
#                     WHERE id = :wallet_id
#                 """)
#                 db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

#                 transaction_query = text("""
#                     INSERT INTO wallet_transactions 
#                     (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
#                     VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'prize', NOW())
#                 """)
#                 db.execute(transaction_query, {
#                     "user_id": winner["user_id"],
#                     "wallet_id": wallet_id,
#                     "amount": prize_amount,
#                     "description": f"Lucky Draw Prize: {draw_name}"
#                 })

#         db.commit()

#         return {
#             "message": "Winner selected successfully!",
#             "winner": winner,
#             "prize_amount": prize_amount
#         }

#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/admin/lucky-draws/winners")
# def get_winners_history(
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         winners_query = text("""
#             SELECT 
#                 ldm.name as draw_name,
#                 ldm.prize_amount,
#                 ldm.winner_selected_at,
#                 ldt.participant_name,
#                 ldt.email,
#                 ldt.phone,
#                 ldt.ticket_number,
#                 u.full_name as user_name
#             FROM lucky_draw_master ldm
#             JOIN lucky_draw_tickets ldt ON ldm.winner_user_id = ldt.user_id AND ldm.name = ldt.draw_name
#             JOIN users u ON ldt.user_id = u.id
#             WHERE ldm.winner_selected = true
#             AND ldt.is_winner = true
#             ORDER BY ldm.winner_selected_at DESC
#         """)
        
#         winners_result = db.execute(winners_query)
#         winners = [dict(row) for row in winners_result.mappings()]

#         return {"winners": winners}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    

# # Add to ADMIN/admin-backend/main.py

# # In admin-backend/main.py - Add this endpoint for schemes management

# @app.get("/admin/schemes/overview")
# def get_schemes_overview(
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Total schemes count
#         total_schemes_query = text("SELECT COUNT(*) as total FROM schemes")
#         total_schemes = db.execute(total_schemes_query).scalar()
        
#         # Schemes by type
#         type_counts_query = text("""
#             SELECT scheme_type, COUNT(*) as count 
#             FROM schemes 
#             GROUP BY scheme_type
#         """)
#         type_counts_result = db.execute(type_counts_query)
#         type_counts = {row["scheme_type"]: row["count"] for row in type_counts_result.mappings()}
        
#         # Schemes by status
#         status_counts_query = text("""
#             SELECT status, COUNT(*) as count 
#             FROM schemes 
#             GROUP BY status
#         """)
#         status_counts_result = db.execute(status_counts_query)
#         status_counts = {row["status"]: row["count"] for row in status_counts_result.mappings()}
        
#         # Total amount collected
#         total_collected_query = text("SELECT SUM(total_paid) as total FROM schemes")
#         total_collected = db.execute(total_collected_query).scalar() or 0
        
#         # Total bonus to be paid
#         total_bonus_query = text("""
#             SELECT SUM(bonus_amount) as total 
#             FROM schemes 
#             WHERE status = 'completed' AND bonus_eligible = true
#         """)
#         total_bonus = db.execute(total_bonus_query).scalar() or 0
        
#         # Recent schemes
#         recent_schemes_query = text("""
#             SELECT s.*, u.full_name as user_name
#             FROM schemes s
#             JOIN users u ON s.user_id = u.id
#             ORDER BY s.created_at DESC
#             LIMIT 10
#         """)
#         recent_schemes_result = db.execute(recent_schemes_query)
#         recent_schemes = [dict(row) for row in recent_schemes_result.mappings()]
        
#         return {
#             "total_schemes": total_schemes,
#             "type_counts": type_counts,
#             "status_counts": status_counts,
#             "total_collected": float(total_collected),
#             "total_bonus": float(total_bonus),
#             "recent_schemes": recent_schemes
#         }
        
#     except Exception as e:
#         print(f"🟥 Error generating schemes overview: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/admin/schemes/{scheme_id}/details")
# def get_scheme_admin_details(
#     scheme_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get scheme details
#         scheme_query = text("""
#             SELECT s.*, u.full_name as user_name, u.email as user_email
#             FROM schemes s
#             JOIN users u ON s.user_id = u.id
#             WHERE s.id = :scheme_id
#         """)
#         scheme = db.execute(scheme_query, {"scheme_id": scheme_id}).mappings().first()
        
#         if not scheme:
#             raise HTTPException(status_code=404, detail="Scheme not found")
        
#         # Get instalments
#         instalments_query = text("""
#             SELECT * FROM scheme_instalments 
#             WHERE scheme_id = :scheme_id 
#             ORDER BY instalment_number
#         """)
#         instalments_result = db.execute(instalments_query, {"scheme_id": scheme_id})
#         instalments = [dict(row) for row in instalments_result.mappings()]
        
#         # Get transactions
#         transactions_query = text("""
#             SELECT * FROM wallet_transactions 
#             WHERE scheme_name = :scheme_name 
#             ORDER BY created_at DESC
#         """)
#         transactions_result = db.execute(transactions_query, {"scheme_name": scheme["scheme_name"]})
#         transactions = [dict(row) for row in transactions_result.mappings()]
        
#         return {
#             "scheme": dict(scheme),
#             "instalments": instalments,
#             "transactions": transactions
#         }
        
#     except Exception as e:
#         print(f"🟥 Error fetching scheme details: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)




# admin-backend/main.py - COMPLETE UPDATED VERSION WITH FIXED ADMIN WALLET SYSTEM
from fastapi import FastAPI, Depends, HTTPException, Header, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional
import os
import random
import uuid
import hashlib
import hmac
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_PANEL_TOKEN = os.getenv("ADMIN_PANEL_TOKEN")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_RhZEbmOoiAcU8M")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "FWKpOs1rtm2yGpWv9gNlnQYC")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Try to import razorpay, but provide fallback for development
try:
    import razorpay
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    print("🟦 Razorpay client initialized successfully")
except ImportError:
    print("🟧 Razorpay not installed. Using simulation mode.")
    razorpay_client = None
except Exception as e:
    print(f"🟧 Razorpay initialization failed: {e}. Using simulation mode.")
    razorpay_client = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD PRODUCTS TO ALLOWED TABLES
ALLOWED_TABLES = [
    "users",
    "cart",
    "wishlist",
    "order_items",
    "orders",
    "wallets",
    "wallet_transactions",
    "lucky_draw_tickets",
    "bill_uploads",
    "schemes",
    "lucky_draw_master",
    "products",
    "admin_wallet",  # NEW TABLE
    "admin_wallet_transactions",  # NEW TABLE
]

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str

class UpdateRowRequest(BaseModel):
    data: Dict[str, Any]

class SelectWinnerRequest(BaseModel):
    ticket_id: int

class ApproveCashbackRequest(BaseModel):
    cashback_amount: float

class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "INR"

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class ManualRechargeRequest(BaseModel):
    amount: float
    description: str = "Manual recharge by admin"

# CREATE ADMIN WALLET TABLES IF NOT EXISTS
def create_admin_wallet_tables(db: Session):
    try:
        # Check if admin_wallet table exists
        check_wallet_table = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admin_wallet'
            );
        """)
        wallet_table_exists = db.execute(check_wallet_table).scalar()
        
        if not wallet_table_exists:
            print("🟦 Creating admin_wallet table...")
            # Create admin_wallet table
            create_wallet_table = text("""
                CREATE TABLE admin_wallet (
                    id SERIAL PRIMARY KEY,
                    total_balance DECIMAL(15,2) DEFAULT 0.00,
                    available_balance DECIMAL(15,2) DEFAULT 0.00,
                    total_recharged DECIMAL(15,2) DEFAULT 0.00,
                    total_spent DECIMAL(15,2) DEFAULT 0.00,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            db.execute(create_wallet_table)
            
            # Insert initial admin wallet record
            init_wallet_query = text("""
                INSERT INTO admin_wallet (total_balance, available_balance, total_recharged, total_spent)
                VALUES (10000, 10000, 10000, 0)
            """)
            db.execute(init_wallet_query)
            db.commit()
            print("🟦 Admin wallet table created successfully with initial balance of ₹10,000")
        else:
            print("🟦 Admin wallet table already exists")
        
        # Check if admin_wallet_transactions table exists
        check_transactions_table = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admin_wallet_transactions'
            );
        """)
        transactions_table_exists = db.execute(check_transactions_table).scalar()
        
        if not transactions_table_exists:
            print("🟦 Creating admin_wallet_transactions table...")
            # Create admin_wallet_transactions table
            create_transactions_table = text("""
                CREATE TABLE admin_wallet_transactions (
                    id SERIAL PRIMARY KEY,
                    wallet_id INTEGER NOT NULL,
                    amount DECIMAL(15,2) NOT NULL,
                    transaction_type VARCHAR(50) NOT NULL,
                    payment_method VARCHAR(50),
                    razorpay_order_id VARCHAR(255),
                    razorpay_payment_id VARCHAR(255),
                    description TEXT,
                    status VARCHAR(50) DEFAULT 'completed',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            db.execute(create_transactions_table)
            
            # Create initial transaction for the starting balance
            init_transaction_query = text("""
                INSERT INTO admin_wallet_transactions 
                (wallet_id, amount, transaction_type, payment_method, description, status)
                VALUES (1, 10000, 'manual_recharge', 'system', 'Initial admin wallet balance', 'completed')
            """)
            db.execute(init_transaction_query)
            db.commit()
            print("🟦 Admin wallet transactions table created successfully")
        else:
            print("🟦 Admin wallet transactions table already exists")
            
    except Exception as e:
        print(f"🟥 Error creating admin wallet tables: {e}")
        db.rollback()
        raise

# CREATE PRODUCTS TABLE IF NOT EXISTS
def create_products_table(db: Session):
    try:
        # Check if products table exists
        check_table_query = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'products'
            );
        """)
        table_exists = db.execute(check_table_query).scalar()
        
        if not table_exists:
            # Create products table
            create_table_query = text("""
                CREATE TABLE products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    old_price DECIMAL(10,2),
                    image_url VARCHAR(500) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    brand VARCHAR(100) NOT NULL,
                    rating DECIMAL(3,2) DEFAULT 0.0,
                    stock_quantity INTEGER DEFAULT 0,
                    is_featured BOOLEAN DEFAULT FALSE,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            db.execute(create_table_query)
            db.commit()
            print("🟦 Products table created successfully")
        else:
            print("🟦 Products table already exists")
            
    except Exception as e:
        print(f"🟥 Error creating products table: {e}")
        db.rollback()

# CREATE UPLOADS DIRECTORY FOR PRODUCT IMAGES
PRODUCT_UPLOADS_DIR = "uploads/products"
os.makedirs(PRODUCT_UPLOADS_DIR, exist_ok=True)

# Mount static files for product images
app.mount("/static/products", StaticFiles(directory=PRODUCT_UPLOADS_DIR), name="product_images")

def verify_admin(token: str = Header(..., alias="X-Admin-Token")):
    if token != ADMIN_PANEL_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")

def ensure_table_allowed(table_name: str):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Table not allowed")

# UPDATED: Correct path to user backend uploads
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_BACKEND_UPLOADS = os.path.abspath(os.path.join(BASE_DIR, "..", "Ecommerce", "backend", "uploads", "bills"))

# Create directory if it doesn't exist
os.makedirs(USER_BACKEND_UPLOADS, exist_ok=True)

print(f"🟦 Looking for images in: {USER_BACKEND_UPLOADS}")

# INITIALIZE TABLES ON STARTUP
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        create_products_table(db)
        create_admin_wallet_tables(db)
        print("🟦 All tables initialized successfully")
    except Exception as e:
        print(f"🟥 Error during startup: {e}")
    finally:
        db.close()

@app.post("/admin/login", response_model=LoginResponse)
def admin_login(body: LoginRequest):
    if body.username == ADMIN_USERNAME and body.password == ADMIN_PASSWORD:
        return LoginResponse(token=ADMIN_PANEL_TOKEN)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/admin/tables")
def get_tables(_: str = Depends(verify_admin)):
    return {"tables": ALLOWED_TABLES}

@app.get("/admin/table/{table_name}")
def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    ensure_table_allowed(table_name)
    query = text(f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT :limit OFFSET :offset")
    result = db.execute(query, {"limit": limit, "offset": offset})
    rows = [dict(row) for row in result.mappings()]
    return {"rows": rows}

@app.get("/admin/table/{table_name}/{row_id}")
def get_single_row(
    table_name: str,
    row_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    ensure_table_allowed(table_name)
    query = text(f"SELECT * FROM {table_name} WHERE id = :id")
    row = db.execute(query, {"id": row_id}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
    return {"row": dict(row)}

# UPDATED CREATE ROW TO HANDLE PRODUCT IMAGES
@app.post("/admin/table/{table_name}")
async def create_row(
    table_name: str,
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    ensure_table_allowed(table_name)

    # Check if it's a multipart form (for product image upload)
    content_type = request.headers.get("content-type", "")
    
    if "multipart/form-data" in content_type and table_name == "products":
        return await create_product_with_image(request, db)
    else:
        # Original JSON handling for other tables
        body = await request.json()
        if not body.get("data"):
            raise HTTPException(status_code=400, detail="No fields provided")

        data = body["data"]
        columns = ", ".join(data.keys())
        values = ", ".join([f":{col}" for col in data.keys()])

        query = text(f"INSERT INTO {table_name} ({columns}) VALUES ({values})")

        try:
            db.execute(query, data)
            db.commit()
            return {"status": "created"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

# NEW: HANDLE PRODUCT CREATION WITH IMAGE UPLOAD
async def create_product_with_image(request: Request, db: Session):
    try:
        form_data = await request.form()
        
        # Extract product data from form
        product_data = {
            "name": form_data.get("name"),
            "description": form_data.get("description"),
            "price": float(form_data.get("price", 0)),
            "old_price": float(form_data.get("old_price", 0)) if form_data.get("old_price") else None,
            "category": form_data.get("category"),
            "brand": form_data.get("brand"),
            "stock_quantity": int(form_data.get("stock_quantity", 0)),
            "is_featured": form_data.get("is_featured", "false").lower() == "true",
            "status": form_data.get("status", "active")
        }
        
        # Handle image upload
        image_file = form_data.get("image")
        if not image_file or not hasattr(image_file, "filename") or not image_file.filename:
            raise HTTPException(status_code=400, detail="Product image is required")
        
        # Generate safe filename (shorter and without special characters)
        import re
        # Clean and shorten product name and brand
        clean_name = re.sub(r'[^\w\s-]', '', product_data['name']).strip()[:30]  # Limit to 30 chars
        clean_brand = re.sub(r'[^\w\s-]', '', product_data['brand']).strip()[:20]  # Limit to 20 chars
        clean_name = re.sub(r'[-\s]+', '_', clean_name)
        clean_brand = re.sub(r'[-\s]+', '_', clean_brand)
        
        # Get file extension safely
        filename = image_file.filename
        file_extension = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
        if file_extension not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
            file_extension = 'jpg'
        
        unique_id = uuid.uuid4().hex[:8]
        unique_filename = f"{clean_brand}_{clean_name}_{unique_id}.{file_extension}"
        image_path = os.path.join(PRODUCT_UPLOADS_DIR, unique_filename)
        
        # Ensure directory exists
        os.makedirs(PRODUCT_UPLOADS_DIR, exist_ok=True)
        
        print(f"🟦 Saving image to: {image_path}")  # Debug log
        
        # Save image file
        content = await image_file.read()
        with open(image_path, "wb") as buffer:
            buffer.write(content)
        
        # Add image URL to product data (use forward slashes for URLs)
        product_data["image_url"] = f"/static/products/{unique_filename}"
        
        # Insert into database
        columns = ", ".join(product_data.keys())
        values = ", ".join([f":{col}" for col in product_data.keys()])
        
        query = text(f"INSERT INTO products ({columns}) VALUES ({values}) RETURNING id")
        
        try:
            result = db.execute(query, product_data)
            new_product_id = result.scalar()
            db.commit()
            
            print(f"🟦 Product created with ID: {new_product_id}")  # Debug log
            
            return {
                "status": "created", 
                "message": "Product created successfully",
                "product_id": new_product_id
            }
        except Exception as e:
            # Delete uploaded image if database operation fails
            if os.path.exists(image_path):
                os.remove(image_path)
            db.rollback()
            print(f"🟥 Database error: {e}")  # Debug log
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"🟥 Error processing form data: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Error processing form data: {str(e)}")

@app.put("/admin/table/{table_name}/{row_id}")
def update_row(
    table_name: str,
    row_id: int,
    body: UpdateRowRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    ensure_table_allowed(table_name)

    if "id" in body.data:
        body.data.pop("id")

    if not body.data:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join([f"{col} = :{col}" for col in body.data.keys()])
    params = body.data.copy()
    params["id"] = row_id

    query = text(f"UPDATE {table_name} SET {set_clause} WHERE id = :id")

    result = db.execute(query, params)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Row not found")

    db.commit()
    return {"status": "ok"}

@app.delete("/admin/table/{table_name}/{row_id}")
def delete_row(
    table_name: str,
    row_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    ensure_table_allowed(table_name)

    query = text(f"DELETE FROM {table_name} WHERE id = :id")
    result = db.execute(query, {"id": row_id})

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Row not found")

    db.commit()
    return {"status": "deleted"}

# ADMIN WALLET ENDPOINTS - FIXED VERSION
@app.get("/admin/wallet/balance")
def get_admin_wallet_balance(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        print("🟦 Fetching admin wallet balance...")
        query = text("SELECT * FROM admin_wallet WHERE id = 1")
        wallet = db.execute(query).mappings().first()
        
        if not wallet:
            print("🟥 Admin wallet not found in database")
            # Try to create it
            create_wallet_query = text("""
                INSERT INTO admin_wallet (total_balance, available_balance, total_recharged, total_spent)
                VALUES (10000, 10000, 10000, 0)
                RETURNING *
            """)
            wallet = db.execute(create_wallet_query).mappings().first()
            db.commit()
            print("🟦 Created new admin wallet with initial balance")
            
        print(f"🟦 Wallet data: {dict(wallet)}")
        return {
            "total_balance": float(wallet["total_balance"] or 0),
            "available_balance": float(wallet["available_balance"] or 0),
            "total_recharged": float(wallet["total_recharged"] or 0),
            "total_spent": float(wallet["total_spent"] or 0)
        }
        
    except Exception as e:
        print(f"🟥 Error in get_admin_wallet_balance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get wallet balance: {str(e)}")

@app.get("/admin/wallet/transactions")
def get_admin_wallet_transactions(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        query = text("""
            SELECT * FROM admin_wallet_transactions 
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        """)
        result = db.execute(query, {"limit": limit, "offset": offset})
        transactions = [dict(row) for row in result.mappings()]
        
        return {"transactions": transactions}
        
    except Exception as e:
        print(f"🟥 Error in get_admin_wallet_transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# MANUAL RECHARGE ENDPOINT (for testing without Razorpay)
@app.post("/admin/wallet/manual-recharge")
def manual_recharge(
    body: ManualRechargeRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        if body.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        # Update wallet balance
        update_wallet_query = text("""
            UPDATE admin_wallet 
            SET total_balance = total_balance + :amount,
                available_balance = available_balance + :amount,
                total_recharged = total_recharged + :amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING available_balance
        """)
        
        result = db.execute(update_wallet_query, {"amount": body.amount})
        new_balance = result.scalar()
        
        # Create transaction record
        transaction_query = text("""
            INSERT INTO admin_wallet_transactions 
            (wallet_id, amount, transaction_type, payment_method, description, status)
            VALUES (1, :amount, 'manual_recharge', 'admin', :description, 'completed')
            RETURNING id
        """)
        
        db.execute(transaction_query, {
            "amount": body.amount,
            "description": body.description
        })
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Wallet recharged with ₹{body.amount}",
            "amount_added": body.amount,
            "new_balance": float(new_balance),
            "transaction_type": "manual_recharge"
        }
        
    except Exception as e:
        db.rollback()
        print(f"🟥 Error in manual_recharge: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/wallet/create-recharge-order")
def create_recharge_order(
    body: CreateOrderRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        print(f"🟦 DEBUG: Creating recharge order for amount: {body.amount}")
        print(f"🟦 DEBUG: Razorpay Key ID: {RAZORPAY_KEY_ID}")
        print(f"🟦 DEBUG: Razorpay Client: {razorpay_client}")
        
        # Convert amount to paise (Razorpay expects amount in smallest currency unit)
        amount_in_paise = int(body.amount * 100)
        print(f"🟦 DEBUG: Amount in paise: {amount_in_paise}")
        
        if razorpay_client is None:
            # Simulate order creation for development
            order_id = f"order_sim_{random.randint(100000, 999999)}"
            print(f"🟧 DEBUG: Simulating Razorpay order: {order_id}")
        else:
            # Create Razorpay order
            order_data = {
                'amount': amount_in_paise,
                'currency': body.currency,
                'payment_capture': 1
            }
            
            print(f"🟦 DEBUG: Creating Razorpay order with data: {order_data}")
            razorpay_order = razorpay_client.order.create(order_data)
            order_id = razorpay_order['id']
            print(f"🟦 DEBUG: Razorpay order created: {order_id}")
        
        # Create transaction record
        transaction_query = text("""
            INSERT INTO admin_wallet_transactions 
            (wallet_id, amount, transaction_type, payment_method, razorpay_order_id, description, status)
            VALUES (1, :amount, 'recharge', 'razorpay', :order_id, 'Wallet recharge via Razorpay', 'pending')
            RETURNING id
        """)
        
        result = db.execute(transaction_query, {
            "amount": body.amount,
            "order_id": order_id
        })
        transaction_id = result.scalar()
        db.commit()
        
        print(f"🟦 DEBUG: Transaction created with ID: {transaction_id}")
        
        return {
            "order_id": order_id,
            "amount": body.amount,
            "currency": body.currency,
            "razorpay_key_id": RAZORPAY_KEY_ID,
            "transaction_id": transaction_id
        }
        
    except Exception as e:
        print(f"🟥 DEBUG: Error in create_recharge_order: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/wallet/verify-payment")
def verify_payment(
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        if razorpay_client is None:
            # Simulate payment verification for development
            print(f"🟧 Simulating payment verification for order: {body.razorpay_order_id}")
            # For development, we'll just mark it as successful
            is_valid = True
        else:
            # Verify payment signature
            params_dict = {
                'razorpay_order_id': body.razorpay_order_id,
                'razorpay_payment_id': body.razorpay_payment_id,
                'razorpay_signature': body.razorpay_signature
            }
            
            is_valid = razorpay_client.utility.verify_payment_signature(params_dict)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Update transaction status
        update_transaction_query = text("""
            UPDATE admin_wallet_transactions 
            SET status = 'completed', 
                razorpay_payment_id = :payment_id,
                description = 'Wallet recharge completed via Razorpay'
            WHERE razorpay_order_id = :order_id
            RETURNING amount
        """)
        
        result = db.execute(update_transaction_query, {
            "payment_id": body.razorpay_payment_id,
            "order_id": body.razorpay_order_id
        })
        
        transaction = result.mappings().first()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Update wallet balance
        update_wallet_query = text("""
            UPDATE admin_wallet 
            SET total_balance = total_balance + :amount,
                available_balance = available_balance + :amount,
                total_recharged = total_recharged + :amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """)
        
        db.execute(update_wallet_query, {"amount": transaction["amount"]})
        db.commit()
        
        return {
            "status": "success",
            "message": "Payment verified and wallet recharged successfully",
            "amount_added": float(transaction["amount"])
        }
        
    except Exception as e:
        db.rollback()
        print(f"🟥 Error in verify_payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# UPDATED ECB CASHBACK APPROVAL TO CHECK ADMIN WALLET BALANCE
@app.post("/admin/ecb/approve-cashback/{upload_id}")
def approve_cashback(
    upload_id: int,
    body: ApproveCashbackRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Check admin wallet balance first
        wallet_query = text("SELECT available_balance FROM admin_wallet WHERE id = 1")
        wallet = db.execute(wallet_query).mappings().first()
        
        if not wallet:
            raise HTTPException(status_code=404, detail="Admin wallet not found")
        
        available_balance = float(wallet["available_balance"] or 0)
        if available_balance < body.cashback_amount:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance in admin wallet. Available: ₹{available_balance}, Required: ₹{body.cashback_amount}"
            )
        
        # Get bill upload
        upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
        upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
        if not upload:
            raise HTTPException(status_code=404, detail="Bill upload not found")
        
        if upload["status"] != "under_review":
            raise HTTPException(status_code=400, detail="Cashback already processed")
        
        # Get user's wallet
        wallet_query = text("SELECT * FROM wallets WHERE user_id = :user_id")
        user_wallet = db.execute(wallet_query, {"user_id": upload["user_id"]}).mappings().first()
        
        if not user_wallet:
            # Create wallet if it doesn't exist
            create_wallet_query = text("INSERT INTO wallets (user_id, main_balance) VALUES (:user_id, 0)")
            db.execute(create_wallet_query, {"user_id": upload["user_id"]})
            db.commit()
            user_wallet = db.execute(wallet_query, {"user_id": upload["user_id"]}).mappings().first()
        
        # Add cashback to user wallet
        update_user_wallet_query = text("""
            UPDATE wallets 
            SET main_balance = main_balance + :amount,
            updated_at = NOW()
            WHERE user_id = :user_id
        """)
        db.execute(update_user_wallet_query, {"amount": body.cashback_amount, "user_id": upload["user_id"]})
        
        # Create wallet transaction for user
        transaction_query = text("""
            INSERT INTO wallet_transactions 
            (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
            VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'cashback', NOW())
        """)
        db.execute(transaction_query, {
            "user_id": upload["user_id"],
            "wallet_id": user_wallet["id"],
            "amount": body.cashback_amount,
            "description": f"Cashback approved for {upload['ticket_type']}"
        })
        
        # Deduct from admin wallet
        update_admin_wallet_query = text("""
            UPDATE admin_wallet 
            SET available_balance = available_balance - :amount,
                total_spent = total_spent + :amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """)
        db.execute(update_admin_wallet_query, {"amount": body.cashback_amount})
        
        # Create admin wallet transaction for cashback payout
        admin_transaction_query = text("""
            INSERT INTO admin_wallet_transactions 
            (wallet_id, amount, transaction_type, payment_method, description, status)
            VALUES (1, :amount, 'cashback_payout', 'system', :description, 'completed')
        """)
        db.execute(admin_transaction_query, {
            "amount": -body.cashback_amount,  # Negative amount for payout
            "description": f"Cashback payout for user {upload['user_id']} - Upload #{upload_id}"
        })
        
        # Update upload status
        update_upload_query = text("""
            UPDATE bill_uploads 
            SET status = 'approved',
            updated_at = NOW()
            WHERE id = :upload_id
        """)
        db.execute(update_upload_query, {"upload_id": upload_id})
        
        db.commit()
        
        return {
            "message": f"Cashback of ₹{body.cashback_amount} approved successfully",
            "user_id": upload["user_id"],
            "new_user_balance": float(user_wallet["main_balance"] or 0) + body.cashback_amount,
            "remaining_admin_balance": available_balance - body.cashback_amount
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# UPDATED LUCKY DRAW WINNER SELECTION TO CHECK ADMIN WALLET BALANCE
@app.post("/admin/lucky-draws/{draw_id}/select-random-winner")
def select_random_winner(
    draw_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        draw_query = text("""
            SELECT name, prize_amount FROM lucky_draw_master 
            WHERE id = :draw_id AND winner_selected = false
        """)
        draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
        if not draw_result:
            raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

        draw_name = draw_result["name"]
        prize_amount = draw_result["prize_amount"] or 0

        # Check admin wallet balance for prize money
        if prize_amount > 0:
            wallet_query = text("SELECT available_balance FROM admin_wallet WHERE id = 1")
            wallet = db.execute(wallet_query).mappings().first()
            
            available_balance = float(wallet["available_balance"] or 0)
            if available_balance < prize_amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient balance in admin wallet for prize. Available: ₹{available_balance}, Required: ₹{prize_amount}"
                )

        participants_query = text("""
            SELECT * FROM lucky_draw_tickets 
            WHERE draw_name = :draw_name
        """)
        participants_result = db.execute(participants_query, {"draw_name": draw_name})
        participants = [dict(row) for row in participants_result.mappings()]

        if not participants:
            raise HTTPException(status_code=400, detail="No participants for this draw")

        winner = random.choice(participants)

        update_draw_query = text("""
            UPDATE lucky_draw_master 
            SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
            WHERE id = :draw_id
        """)
        db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

        update_winner_query = text("""
            UPDATE lucky_draw_tickets 
            SET is_winner = true, status = 'won'
            WHERE id = :ticket_id
        """)
        db.execute(update_winner_query, {"ticket_id": winner["id"]})

        update_losers_query = text("""
            UPDATE lucky_draw_tickets 
            SET status = 'lost'
            WHERE draw_name = :draw_name AND id != :winner_ticket_id
        """)
        db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

        if prize_amount > 0:
            wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
            wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
            if wallet_result:
                wallet_id = wallet_result["id"]
                
                # Add prize to user wallet
                update_wallet_query = text("""
                    UPDATE wallets 
                    SET main_balance = main_balance + :prize_amount,
                    updated_at = NOW()
                    WHERE id = :wallet_id
                """)
                db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

                # Create user wallet transaction
                transaction_query = text("""
                    INSERT INTO wallet_transactions 
                    (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
                    VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'prize', NOW())
                """)
                db.execute(transaction_query, {
                    "user_id": winner["user_id"],
                    "wallet_id": wallet_id,
                    "amount": prize_amount,
                    "description": f"Lucky Draw Prize: {draw_name}"
                })

                # Deduct from admin wallet
                update_admin_wallet_query = text("""
                    UPDATE admin_wallet 
                    SET available_balance = available_balance - :prize_amount,
                        total_spent = total_spent + :prize_amount,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = 1
                """)
                db.execute(update_admin_wallet_query, {"prize_amount": prize_amount})

                # Create admin wallet transaction for prize payout
                admin_transaction_query = text("""
                    INSERT INTO admin_wallet_transactions 
                    (wallet_id, amount, transaction_type, payment_method, description, status)
                    VALUES (1, :amount, 'prize_payout', 'system', :description, 'completed')
                """)
                db.execute(admin_transaction_query, {
                    "amount": -prize_amount,  # Negative amount for payout
                    "description": f"Prize payout for lucky draw '{draw_name}' - Winner: {winner['participant_name']}"
                })

        db.commit()

        return {
            "message": "Winner selected successfully!",
            "winner": winner,
            "prize_amount": prize_amount
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# KEEP ALL YOUR EXISTING ENDPOINTS EXACTLY AS THEY WERE (ECB, LUCKY DRAW, SCHEMES, ETC.)
# ... [All the existing endpoints for ECB, Lucky Draw, Schemes, etc. remain exactly the same]

# PUBLIC IMAGE ENDPOINT (NO AUTH REQUIRED)
@app.get("/public/ecb/bill-image/{upload_id}")
async def get_public_bill_image(
    upload_id: int,
    db: Session = Depends(get_db),
):
    """Public endpoint for bill images (no authentication required)"""
    try:
        # Get bill upload with image filename
        upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
        upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
        if not upload:
            raise HTTPException(status_code=404, detail="Bill upload not found")
        
        if not upload["bill_image_path"]:
            raise HTTPException(status_code=404, detail="No image available")
        
        filename = upload["bill_image_path"]
        
        # Check multiple possible locations
        possible_paths = [
            os.path.join(USER_BACKEND_UPLOADS, filename),
            os.path.join("D:/Ecommerce/backend/uploads/bills", filename),
            os.path.join("../backend/uploads/bills", filename),
            os.path.join("../../backend/uploads/bills", filename),
        ]
        
        file_path = None
        for path in possible_paths:
            if os.path.exists(path):
                file_path = path
                print(f"🟦 Found image at: {file_path}")
                break
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"Image file not found. Searched: {filename}")
        
        # Return the actual image file
        return FileResponse(
            file_path, 
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        print(f"🟥 Error serving public image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ADMIN IMAGE ENDPOINT WITH TOKEN SUPPORT
@app.get("/admin/ecb/bill-image/{upload_id}")
async def get_bill_image_admin(
    upload_id: int,
    request: Request,
    db: Session = Depends(get_db),
    token: str = Header(None, alias="X-Admin-Token"),
):
    try:
        # Flexible token verification
        if not token:
            # Check if token is in query parameter (for img tags)
            token = request.query_params.get("token")
        
        if not token or token != ADMIN_PANEL_TOKEN:
            print(f"🟥 Invalid token received")
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        # Get bill upload with image filename
        upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
        upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
        if not upload:
            raise HTTPException(status_code=404, detail="Bill upload not found")
        
        if not upload["bill_image_path"]:
            raise HTTPException(status_code=404, detail="No image available")
        
        filename = upload["bill_image_path"]
        
        # Check multiple possible locations
        possible_paths = [
            os.path.join(USER_BACKEND_UPLOADS, filename),
            os.path.join("D:/Ecommerce/backend/uploads/bills", filename),
            os.path.join("../backend/uploads/bills", filename),
            os.path.join("../../backend/uploads/bills", filename),
        ]
        
        file_path = None
        for path in possible_paths:
            if os.path.exists(path):
                file_path = path
                print(f"🟦 Found image at: {file_path}")
                break
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"Image file not found. Searched: {filename}")
        
        # Return the actual image file
        return FileResponse(
            file_path, 
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🟥 Error serving image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# GET BILL IMAGE INFO (for displaying in modal)
@app.get("/admin/ecb/bill-image-info/{upload_id}")
def get_bill_image_info(
    upload_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
        upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
        if not upload:
            raise HTTPException(status_code=404, detail="Bill upload not found")
        
        filename = upload["bill_image_path"]
        
        # Check multiple possible locations
        possible_paths = [
            os.path.join(USER_BACKEND_UPLOADS, filename),
            os.path.join("D:/Ecommerce/backend/uploads/bills", filename),
            os.path.join("../backend/uploads/bills", filename),
            os.path.join("../../backend/uploads/bills", filename),
        ]
        
        file_exists = False
        actual_path = ""
        
        for path in possible_paths:
            if os.path.exists(path):
                file_exists = True
                actual_path = path
                break
        
        image_url = f"http://localhost:8001/admin/ecb/bill-image/{upload_id}"
        public_image_url = f"http://localhost:8001/public/ecb/bill-image/{upload_id}"
        
        return {
            "upload_id": upload_id,
            "user_id": upload["user_id"],
            "ticket_type": upload["ticket_type"],
            "bill_amount": upload["bill_amount"],
            "description": upload["description"],
            "filename": filename,
            "image_url": image_url,
            "public_image_url": public_image_url,
            "file_exists": file_exists,
            "actual_path": actual_path
        }
        
    except Exception as e:
        print(f"🟥 Error getting image info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ECB REPORTS ENDPOINT
@app.get("/admin/ecb/reports")
def get_ecb_reports(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Get total bill uploads count
        total_uploads_query = text("SELECT COUNT(*) as total FROM bill_uploads")
        total_uploads = db.execute(total_uploads_query).scalar()
        
        # Get uploads by status
        status_counts_query = text("""
            SELECT status, COUNT(*) as count 
            FROM bill_uploads 
            GROUP BY status
        """)
        status_counts_result = db.execute(status_counts_query)
        status_counts = {row["status"]: row["count"] for row in status_counts_result.mappings()}
        
        # Get uploads by ticket type
        ticket_type_counts_query = text("""
            SELECT ticket_type, COUNT(*) as count 
            FROM bill_uploads 
            GROUP BY ticket_type
        """)
        ticket_type_counts_result = db.execute(ticket_type_counts_query)
        ticket_type_counts = {row["ticket_type"]: row["count"] for row in ticket_type_counts_result.mappings()}
        
        # Get recent uploads (last 10)
        recent_uploads_query = text("""
            SELECT bu.*, u.full_name as user_name
            FROM bill_uploads bu
            JOIN users u ON bu.user_id = u.id
            ORDER BY bu.created_at DESC
            LIMIT 10
        """)
        recent_uploads_result = db.execute(recent_uploads_query)
        recent_uploads = [dict(row) for row in recent_uploads_result.mappings()]
        
        # Get total cashback approved
        cashback_query = text("""
            SELECT SUM(amount) as total_cashback
            FROM wallet_transactions
            WHERE description LIKE '%Cashback approved%'
        """)
        total_cashback = db.execute(cashback_query).scalar() or 0
        
        return {
            "total_uploads": total_uploads,
            "status_counts": status_counts,
            "ticket_type_counts": ticket_type_counts,
            "recent_uploads": recent_uploads,
            "total_cashback": float(total_cashback),
            "report_generated_at": "2024-01-01T00:00:00Z"  # You can use actual datetime here
        }
        
    except Exception as e:
        print(f"🟥 Error generating ECB reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Lucky Draw endpoints (existing functionality)
@app.get("/admin/lucky-draws/{draw_id}/participants")
def get_lucky_draw_participants(
    draw_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        draw_query = text("SELECT name FROM lucky_draw_master WHERE id = :draw_id")
        draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
        if not draw_result:
            raise HTTPException(status_code=404, detail="Draw not found")

        draw_name = draw_result["name"]

        participants_query = text("""
            SELECT * FROM lucky_draw_tickets 
            WHERE draw_name = :draw_name 
            ORDER BY created_at DESC
        """)
        participants_result = db.execute(participants_query, {"draw_name": draw_name})
        participants = [dict(row) for row in participants_result.mappings()]

        return {
            "draw_id": draw_id,
            "draw_name": draw_name,
            "participants": participants,
            "total_participants": len(participants)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/lucky-draws/{draw_id}/select-winner-manual")
def select_manual_winner(
    draw_id: int,
    body: SelectWinnerRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        draw_query = text("""
            SELECT name, prize_amount FROM lucky_draw_master 
            WHERE id = :draw_id AND winner_selected = false
        """)
        draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
        if not draw_result:
            raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

        draw_name = draw_result["name"]
        prize_amount = draw_result["prize_amount"] or 0

        # Check admin wallet balance for prize money
        if prize_amount > 0:
            wallet_query = text("SELECT available_balance FROM admin_wallet WHERE id = 1")
            wallet = db.execute(wallet_query).mappings().first()
            
            available_balance = float(wallet["available_balance"] or 0)
            if available_balance < prize_amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient balance in admin wallet for prize. Available: ₹{available_balance}, Required: ₹{prize_amount}"
                )

        winner_query = text("""
            SELECT * FROM lucky_draw_tickets 
            WHERE id = :ticket_id AND draw_name = :draw_name
        """)
        winner_result = db.execute(winner_query, {"ticket_id": body.ticket_id, "draw_name": draw_name}).mappings().first()

        if not winner_result:
            raise HTTPException(status_code=404, detail="Ticket not found for this draw")

        winner = dict(winner_result)

        update_draw_query = text("""
            UPDATE lucky_draw_master 
            SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
            WHERE id = :draw_id
        """)
        db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

        update_winner_query = text("""
            UPDATE lucky_draw_tickets 
            SET is_winner = true, status = 'won'
            WHERE id = :ticket_id
        """)
        db.execute(update_winner_query, {"ticket_id": winner["id"]})

        update_losers_query = text("""
            UPDATE lucky_draw_tickets 
            SET status = 'lost'
            WHERE draw_name = :draw_name AND id != :winner_ticket_id
        """)
        db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

        if prize_amount > 0:
            wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
            wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
            if wallet_result:
                wallet_id = wallet_result["id"]
                
                # Add prize to user wallet
                update_wallet_query = text("""
                    UPDATE wallets 
                    SET main_balance = main_balance + :prize_amount,
                    updated_at = NOW()
                    WHERE id = :wallet_id
                """)
                db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

                # Create user wallet transaction
                transaction_query = text("""
                    INSERT INTO wallet_transactions 
                    (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
                    VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'prize', NOW())
                """)
                db.execute(transaction_query, {
                    "user_id": winner["user_id"],
                    "wallet_id": wallet_id,
                    "amount": prize_amount,
                    "description": f"Lucky Draw Prize: {draw_name}"
                })

                # Deduct from admin wallet
                update_admin_wallet_query = text("""
                    UPDATE admin_wallet 
                    SET available_balance = available_balance - :prize_amount,
                        total_spent = total_spent + :prize_amount,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = 1
                """)
                db.execute(update_admin_wallet_query, {"prize_amount": prize_amount})

                # Create admin wallet transaction for prize payout
                admin_transaction_query = text("""
                    INSERT INTO admin_wallet_transactions 
                    (wallet_id, amount, transaction_type, payment_method, description, status)
                    VALUES (1, :amount, 'prize_payout', 'system', :description, 'completed')
                """)
                db.execute(admin_transaction_query, {
                    "amount": -prize_amount,  # Negative amount for payout
                    "description": f"Prize payout for lucky draw '{draw_name}' - Winner: {winner['participant_name']}"
                })

        db.commit()

        return {
            "message": "Winner selected successfully!",
            "winner": winner,
            "prize_amount": prize_amount
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/lucky-draws/winners")
def get_winners_history(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        winners_query = text("""
            SELECT 
                ldm.name as draw_name,
                ldm.prize_amount,
                ldm.winner_selected_at,
                ldt.participant_name,
                ldt.email,
                ldt.phone,
                ldt.ticket_number,
                u.full_name as user_name
            FROM lucky_draw_master ldm
            JOIN lucky_draw_tickets ldt ON ldm.winner_user_id = ldt.user_id AND ldm.name = ldt.draw_name
            JOIN users u ON ldt.user_id = u.id
            WHERE ldm.winner_selected = true
            AND ldt.is_winner = true
            ORDER BY ldm.winner_selected_at DESC
        """)
        
        winners_result = db.execute(winners_query)
        winners = [dict(row) for row in winners_result.mappings()]

        return {"winners": winners}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Schemes management endpoints
@app.get("/admin/schemes/overview")
def get_schemes_overview(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Total schemes count
        total_schemes_query = text("SELECT COUNT(*) as total FROM schemes")
        total_schemes = db.execute(total_schemes_query).scalar()
        
        # Schemes by type
        type_counts_query = text("""
            SELECT scheme_type, COUNT(*) as count 
            FROM schemes 
            GROUP BY scheme_type
        """)
        type_counts_result = db.execute(type_counts_query)
        type_counts = {row["scheme_type"]: row["count"] for row in type_counts_result.mappings()}
        
        # Schemes by status
        status_counts_query = text("""
            SELECT status, COUNT(*) as count 
            FROM schemes 
            GROUP BY status
        """)
        status_counts_result = db.execute(status_counts_query)
        status_counts = {row["status"]: row["count"] for row in status_counts_result.mappings()}
        
        # Total amount collected
        total_collected_query = text("SELECT SUM(total_paid) as total FROM schemes")
        total_collected = db.execute(total_collected_query).scalar() or 0
        
        # Total bonus to be paid
        total_bonus_query = text("""
            SELECT SUM(bonus_amount) as total 
            FROM schemes 
            WHERE status = 'completed' AND bonus_eligible = true
        """)
        total_bonus = db.execute(total_bonus_query).scalar() or 0
        
        # Recent schemes
        recent_schemes_query = text("""
            SELECT s.*, u.full_name as user_name
            FROM schemes s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 10
        """)
        recent_schemes_result = db.execute(recent_schemes_query)
        recent_schemes = [dict(row) for row in recent_schemes_result.mappings()]
        
        return {
            "total_schemes": total_schemes,
            "type_counts": type_counts,
            "status_counts": status_counts,
            "total_collected": float(total_collected),
            "total_bonus": float(total_bonus),
            "recent_schemes": recent_schemes
        }
        
    except Exception as e:
        print(f"🟥 Error generating schemes overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/schemes/{scheme_id}/details")
def get_scheme_admin_details(
    scheme_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Get scheme details
        scheme_query = text("""
            SELECT s.*, u.full_name as user_name, u.email as user_email
            FROM schemes s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = :scheme_id
        """)
        scheme = db.execute(scheme_query, {"scheme_id": scheme_id}).mappings().first()
        
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        
        # Get instalments
        instalments_query = text("""
            SELECT * FROM scheme_instalments 
            WHERE scheme_id = :scheme_id 
            ORDER BY instalment_number
        """)
        instalments_result = db.execute(instalments_query, {"scheme_id": scheme_id})
        instalments = [dict(row) for row in instalments_result.mappings()]
        
        # Get transactions
        transactions_query = text("""
            SELECT * FROM wallet_transactions 
            WHERE scheme_name = :scheme_name 
            ORDER BY created_at DESC
        """)
        transactions_result = db.execute(transactions_query, {"scheme_name": scheme["scheme_name"]})
        transactions = [dict(row) for row in transactions_result.mappings()]
        
        return {
            "scheme": dict(scheme),
            "instalments": instalments,
            "transactions": transactions
        }
        
    except Exception as e:
        print(f"🟥 Error fetching scheme details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)