
# from fastapi import FastAPI, Depends, HTTPException, Header
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker, Session
# from dotenv import load_dotenv
# from typing import Dict, Any, List
# import os
# import random

# # ---------- Load env ----------
# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")
# ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
# ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
# ADMIN_PANEL_TOKEN = os.getenv("ADMIN_PANEL_TOKEN")
# FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# if not DATABASE_URL:
#     raise RuntimeError("DATABASE_URL is not set in .env")

# # ---------- DB setup ----------
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ---------- FastAPI app ----------
# app = FastAPI(title="Admin API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000", "http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Tables allowed in admin panel
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
# ]

# # ---------- Models ----------
# class LoginRequest(BaseModel):
#     username: str
#     password: str

# class LoginResponse(BaseModel):
#     token: str

# class UpdateRowRequest(BaseModel):
#     data: Dict[str, Any]

# class SelectWinnerRequest(BaseModel):
#     ticket_id: int

# # ---------- Helpers ----------
# def verify_admin(token: str = Header(..., alias="X-Admin-Token")):
#     """ Simple header auth """
#     if token != ADMIN_PANEL_TOKEN:
#         raise HTTPException(status_code=401, detail="Invalid admin token")

# def ensure_table_allowed(table_name: str):
#     if table_name not in ALLOWED_TABLES:
#         raise HTTPException(status_code=400, detail="Table not allowed")


# # ---------- ROUTES ----------
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


# # ---------- CREATE NEW ROW ----------
# @app.post("/admin/table/{table_name}")
# def create_row(
#     table_name: str,
#     body: UpdateRowRequest,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     """
#     Insert a new row in any admin table.
#     Body: { "data": { "col1": value1, ... } }
#     """
#     ensure_table_allowed(table_name)

#     if not body.data:
#         raise HTTPException(status_code=400, detail="No fields provided")

#     columns = ", ".join(body.data.keys())
#     values = ", ".join([f":{col}" for col in body.data.keys()])

#     query = text(f"INSERT INTO {table_name} ({columns}) VALUES ({values})")

#     try:
#         db.execute(query, body.data)
#         db.commit()
#         return {"status": "created"}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))


# # ---------- UPDATE ----------
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


# # ---------- DELETE ----------
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


# # 🆕 NEW: GET LUCKY DRAW PARTICIPANTS
# @app.get("/admin/lucky-draws/{draw_id}/participants")
# def get_lucky_draw_participants(
#     draw_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get draw name
#         draw_query = text("SELECT name FROM lucky_draw_master WHERE id = :draw_id")
#         draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
#         if not draw_result:
#             raise HTTPException(status_code=404, detail="Draw not found")

#         draw_name = draw_result["name"]

#         # Get participants
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


# # 🆕 NEW: SELECT RANDOM WINNER
# @app.post("/admin/lucky-draws/{draw_id}/select-random-winner")
# def select_random_winner(
#     draw_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get draw details including prize amount
#         draw_query = text("""
#             SELECT name, prize_amount FROM lucky_draw_master 
#             WHERE id = :draw_id AND winner_selected = false
#         """)
#         draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
#         if not draw_result:
#             raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

#         draw_name = draw_result["name"]
#         prize_amount = draw_result["prize_amount"] or 0

#         # Get all participants
#         participants_query = text("""
#             SELECT * FROM lucky_draw_tickets 
#             WHERE draw_name = :draw_name
#         """)
#         participants_result = db.execute(participants_query, {"draw_name": draw_name})
#         participants = [dict(row) for row in participants_result.mappings()]

#         if not participants:
#             raise HTTPException(status_code=400, detail="No participants for this draw")

#         # Select random winner
#         winner = random.choice(participants)

#         # Update draw as completed with winner
#         update_draw_query = text("""
#             UPDATE lucky_draw_master 
#             SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
#             WHERE id = :draw_id
#         """)
#         db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

#         # Update winner ticket
#         update_winner_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET is_winner = true, status = 'won'
#             WHERE id = :ticket_id
#         """)
#         db.execute(update_winner_query, {"ticket_id": winner["id"]})

#         # Update other tickets as lost
#         update_losers_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET status = 'lost'
#             WHERE draw_name = :draw_name AND id != :winner_ticket_id
#         """)
#         db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

#         # Add prize to winner's wallet if prize amount > 0
#         if prize_amount > 0:
#             # Get winner's wallet
#             wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
#             wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
#             if wallet_result:
#                 wallet_id = wallet_result["id"]
                
#                 # Update wallet balance
#                 update_wallet_query = text("""
#                     UPDATE wallets 
#                     SET main_balance = main_balance + :prize_amount,
#                     updated_at = NOW()
#                     WHERE id = :wallet_id
#                 """)
#                 db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

#                 # Create wallet transaction
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


# # 🆕 NEW: SELECT MANUAL WINNER
# @app.post("/admin/lucky-draws/{draw_id}/select-winner-manual")
# def select_manual_winner(
#     draw_id: int,
#     body: SelectWinnerRequest,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get draw details including prize amount
#         draw_query = text("""
#             SELECT name, prize_amount FROM lucky_draw_master 
#             WHERE id = :draw_id AND winner_selected = false
#         """)
#         draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
#         if not draw_result:
#             raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

#         draw_name = draw_result["name"]
#         prize_amount = draw_result["prize_amount"] or 0

#         # Get the selected winner ticket
#         winner_query = text("""
#             SELECT * FROM lucky_draw_tickets 
#             WHERE id = :ticket_id AND draw_name = :draw_name
#         """)
#         winner_result = db.execute(winner_query, {"ticket_id": body.ticket_id, "draw_name": draw_name}).mappings().first()

#         if not winner_result:
#             raise HTTPException(status_code=404, detail="Ticket not found for this draw")

#         winner = dict(winner_result)

#         # Update draw as completed with winner
#         update_draw_query = text("""
#             UPDATE lucky_draw_master 
#             SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
#             WHERE id = :draw_id
#         """)
#         db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

#         # Update winner ticket
#         update_winner_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET is_winner = true, status = 'won'
#             WHERE id = :ticket_id
#         """)
#         db.execute(update_winner_query, {"ticket_id": winner["id"]})

#         # Update other tickets as lost
#         update_losers_query = text("""
#             UPDATE lucky_draw_tickets 
#             SET status = 'lost'
#             WHERE draw_name = :draw_name AND id != :winner_ticket_id
#         """)
#         db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

#         # Add prize to winner's wallet if prize amount > 0
#         if prize_amount > 0:
#             # Get winner's wallet
#             wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
#             wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
#             if wallet_result:
#                 wallet_id = wallet_result["id"]
                
#                 # Update wallet balance
#                 update_wallet_query = text("""
#                     UPDATE wallets 
#                     SET main_balance = main_balance + :prize_amount,
#                     updated_at = NOW()
#                     WHERE id = :wallet_id
#                 """)
#                 db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

#                 # Create wallet transaction
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


# # 🆕 NEW: GET WINNERS HISTORY
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





# # admin-backend/main.py - UPDATED WITH ECB FUNCTIONALITY
# from fastapi import FastAPI, Depends, HTTPException, Header
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker, Session
# from dotenv import load_dotenv
# from typing import Dict, Any, List
# import os
# import random

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
#     allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000", "http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

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

# def verify_admin(token: str = Header(..., alias="X-Admin-Token")):
#     if token != ADMIN_PANEL_TOKEN:
#         raise HTTPException(status_code=401, detail="Invalid admin token")

# def ensure_table_allowed(table_name: str):
#     if table_name not in ALLOWED_TABLES:
#         raise HTTPException(status_code=400, detail="Table not allowed")

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

# @app.post("/admin/table/{table_name}")
# def create_row(
#     table_name: str,
#     body: UpdateRowRequest,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     ensure_table_allowed(table_name)

#     if not body.data:
#         raise HTTPException(status_code=400, detail="No fields provided")

#     columns = ", ".join(body.data.keys())
#     values = ", ".join([f":{col}" for col in body.data.keys()])

#     query = text(f"INSERT INTO {table_name} ({columns}) VALUES ({values})")

#     try:
#         db.execute(query, body.data)
#         db.commit()
#         return {"status": "created"}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))

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

# # 🆕 NEW: ECB CASHBACK APPROVAL
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

# # 🆕 NEW: GET BILL IMAGE FOR ADMIN
# @app.get("/admin/ecb/bill-image/{upload_id}")
# def get_bill_image_admin(
#     upload_id: int,
#     db: Session = Depends(get_db),
#     _: str = Depends(verify_admin),
# ):
#     try:
#         # Get bill upload with image path
#         upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
#         upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
#         if not upload:
#             raise HTTPException(status_code=404, detail="Bill upload not found")
        
#         if not upload["bill_image_path"]:
#             raise HTTPException(status_code=404, detail="No image available")
        
#         # For now, return the image path - you'll need to implement file serving
#         # In production, you'd serve the actual file
#         return {
#             "image_path": upload["bill_image_path"],
#             "upload_id": upload_id,
#             "user_id": upload["user_id"],
#             "ticket_type": upload["ticket_type"]
#         }
        
#     except Exception as e:
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




# admin-backend/main.py - COMPLETE UPDATED VERSION
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from typing import Dict, Any, List
import os
import random

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_PANEL_TOKEN = os.getenv("ADMIN_PANEL_TOKEN")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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

def verify_admin(token: str = Header(..., alias="X-Admin-Token")):
    if token != ADMIN_PANEL_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")

def ensure_table_allowed(table_name: str):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Table not allowed")

# 🆕 UPDATED: Correct path to user backend uploads
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USER_BACKEND_UPLOADS = os.path.abspath(os.path.join(BASE_DIR, "..", "Ecommerce", "backend", "uploads", "bills"))

# Create directory if it doesn't exist
os.makedirs(USER_BACKEND_UPLOADS, exist_ok=True)

print(f"🟦 Looking for images in: {USER_BACKEND_UPLOADS}")

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

@app.post("/admin/table/{table_name}")
def create_row(
    table_name: str,
    body: UpdateRowRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    ensure_table_allowed(table_name)

    if not body.data:
        raise HTTPException(status_code=400, detail="No fields provided")

    columns = ", ".join(body.data.keys())
    values = ", ".join([f":{col}" for col in body.data.keys()])

    query = text(f"INSERT INTO {table_name} ({columns}) VALUES ({values})")

    try:
        db.execute(query, body.data)
        db.commit()
        return {"status": "created"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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

# 🆕 NEW: PUBLIC IMAGE ENDPOINT (NO AUTH REQUIRED)
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

# 🆕 UPDATED: ADMIN IMAGE ENDPOINT WITH TOKEN SUPPORT
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

# 🆕 NEW: GET BILL IMAGE INFO (for displaying in modal)
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

# 🆕 NEW: ECB REPORTS ENDPOINT
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

# ECB CASHBACK APPROVAL
@app.post("/admin/ecb/approve-cashback/{upload_id}")
def approve_cashback(
    upload_id: int,
    body: ApproveCashbackRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Get bill upload
        upload_query = text("SELECT * FROM bill_uploads WHERE id = :upload_id")
        upload = db.execute(upload_query, {"upload_id": upload_id}).mappings().first()
        
        if not upload:
            raise HTTPException(status_code=404, detail="Bill upload not found")
        
        if upload["status"] != "under_review":
            raise HTTPException(status_code=400, detail="Cashback already processed")
        
        # Get user's wallet
        wallet_query = text("SELECT * FROM wallets WHERE user_id = :user_id")
        wallet = db.execute(wallet_query, {"user_id": upload["user_id"]}).mappings().first()
        
        if not wallet:
            # Create wallet if it doesn't exist
            create_wallet_query = text("INSERT INTO wallets (user_id, main_balance) VALUES (:user_id, 0)")
            db.execute(create_wallet_query, {"user_id": upload["user_id"]})
            db.commit()
            wallet = db.execute(wallet_query, {"user_id": upload["user_id"]}).mappings().first()
        
        # Add cashback to wallet
        update_wallet_query = text("""
            UPDATE wallets 
            SET main_balance = main_balance + :amount,
            updated_at = NOW()
            WHERE user_id = :user_id
        """)
        db.execute(update_wallet_query, {"amount": body.cashback_amount, "user_id": upload["user_id"]})
        
        # Create wallet transaction
        transaction_query = text("""
            INSERT INTO wallet_transactions 
            (user_id, wallet_id, amount, transaction_type, wallet_type, description, payment_method, created_at)
            VALUES (:user_id, :wallet_id, :amount, 'deposit', 'main', :description, 'cashback', NOW())
        """)
        db.execute(transaction_query, {
            "user_id": upload["user_id"],
            "wallet_id": wallet["id"],
            "amount": body.cashback_amount,
            "description": f"Cashback approved for {upload['ticket_type']}"
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
            "new_balance": wallet["main_balance"] + body.cashback_amount
        }
        
    except Exception as e:
        db.rollback()
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
                
                update_wallet_query = text("""
                    UPDATE wallets 
                    SET main_balance = main_balance + :prize_amount,
                    updated_at = NOW()
                    WHERE id = :wallet_id
                """)
                db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

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

        db.commit()

        return {
            "message": "Winner selected successfully!",
            "winner": winner,
            "prize_amount": prize_amount
        }

    except Exception as e:
        db.rollback()
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
                
                update_wallet_query = text("""
                    UPDATE wallets 
                    SET main_balance = main_balance + :prize_amount,
                    updated_at = NOW()
                    WHERE id = :wallet_id
                """)
                db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

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