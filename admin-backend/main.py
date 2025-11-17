# from fastapi import FastAPI, Depends, HTTPException, Header
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import sessionmaker, Session
# from dotenv import load_dotenv
# from typing import Dict, Any
# import os

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
#     "lucky_draw_master",   # ✔ Added here
# ]

# # ---------- Models ----------
# class LoginRequest(BaseModel):
#     username: str
#     password: str

# class LoginResponse(BaseModel):
#     token: str

# class UpdateRowRequest(BaseModel):
#     data: Dict[str, Any]


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




from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from typing import Dict, Any, List
import os
import random

# ---------- Load env ----------
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_PANEL_TOKEN = os.getenv("ADMIN_PANEL_TOKEN")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")

# ---------- DB setup ----------
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- FastAPI app ----------
app = FastAPI(title="Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tables allowed in admin panel
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

# ---------- Models ----------
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str

class UpdateRowRequest(BaseModel):
    data: Dict[str, Any]

class SelectWinnerRequest(BaseModel):
    ticket_id: int

# ---------- Helpers ----------
def verify_admin(token: str = Header(..., alias="X-Admin-Token")):
    """ Simple header auth """
    if token != ADMIN_PANEL_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")

def ensure_table_allowed(table_name: str):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Table not allowed")


# ---------- ROUTES ----------
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


# ---------- CREATE NEW ROW ----------
@app.post("/admin/table/{table_name}")
def create_row(
    table_name: str,
    body: UpdateRowRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    """
    Insert a new row in any admin table.
    Body: { "data": { "col1": value1, ... } }
    """
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


# ---------- UPDATE ----------
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


# ---------- DELETE ----------
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


# 🆕 NEW: GET LUCKY DRAW PARTICIPANTS
@app.get("/admin/lucky-draws/{draw_id}/participants")
def get_lucky_draw_participants(
    draw_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Get draw name
        draw_query = text("SELECT name FROM lucky_draw_master WHERE id = :draw_id")
        draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
        if not draw_result:
            raise HTTPException(status_code=404, detail="Draw not found")

        draw_name = draw_result["name"]

        # Get participants
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


# 🆕 NEW: SELECT RANDOM WINNER
@app.post("/admin/lucky-draws/{draw_id}/select-random-winner")
def select_random_winner(
    draw_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Get draw details including prize amount
        draw_query = text("""
            SELECT name, prize_amount FROM lucky_draw_master 
            WHERE id = :draw_id AND winner_selected = false
        """)
        draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
        if not draw_result:
            raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

        draw_name = draw_result["name"]
        prize_amount = draw_result["prize_amount"] or 0

        # Get all participants
        participants_query = text("""
            SELECT * FROM lucky_draw_tickets 
            WHERE draw_name = :draw_name
        """)
        participants_result = db.execute(participants_query, {"draw_name": draw_name})
        participants = [dict(row) for row in participants_result.mappings()]

        if not participants:
            raise HTTPException(status_code=400, detail="No participants for this draw")

        # Select random winner
        winner = random.choice(participants)

        # Update draw as completed with winner
        update_draw_query = text("""
            UPDATE lucky_draw_master 
            SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
            WHERE id = :draw_id
        """)
        db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

        # Update winner ticket
        update_winner_query = text("""
            UPDATE lucky_draw_tickets 
            SET is_winner = true, status = 'won'
            WHERE id = :ticket_id
        """)
        db.execute(update_winner_query, {"ticket_id": winner["id"]})

        # Update other tickets as lost
        update_losers_query = text("""
            UPDATE lucky_draw_tickets 
            SET status = 'lost'
            WHERE draw_name = :draw_name AND id != :winner_ticket_id
        """)
        db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

        # Add prize to winner's wallet if prize amount > 0
        if prize_amount > 0:
            # Get winner's wallet
            wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
            wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
            if wallet_result:
                wallet_id = wallet_result["id"]
                
                # Update wallet balance
                update_wallet_query = text("""
                    UPDATE wallets 
                    SET main_balance = main_balance + :prize_amount,
                    updated_at = NOW()
                    WHERE id = :wallet_id
                """)
                db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

                # Create wallet transaction
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


# 🆕 NEW: SELECT MANUAL WINNER
@app.post("/admin/lucky-draws/{draw_id}/select-winner-manual")
def select_manual_winner(
    draw_id: int,
    body: SelectWinnerRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin),
):
    try:
        # Get draw details including prize amount
        draw_query = text("""
            SELECT name, prize_amount FROM lucky_draw_master 
            WHERE id = :draw_id AND winner_selected = false
        """)
        draw_result = db.execute(draw_query, {"draw_id": draw_id}).mappings().first()
        
        if not draw_result:
            raise HTTPException(status_code=404, detail="Draw not found or winner already selected")

        draw_name = draw_result["name"]
        prize_amount = draw_result["prize_amount"] or 0

        # Get the selected winner ticket
        winner_query = text("""
            SELECT * FROM lucky_draw_tickets 
            WHERE id = :ticket_id AND draw_name = :draw_name
        """)
        winner_result = db.execute(winner_query, {"ticket_id": body.ticket_id, "draw_name": draw_name}).mappings().first()

        if not winner_result:
            raise HTTPException(status_code=404, detail="Ticket not found for this draw")

        winner = dict(winner_result)

        # Update draw as completed with winner
        update_draw_query = text("""
            UPDATE lucky_draw_master 
            SET winner_selected = true, winner_user_id = :user_id, winner_selected_at = NOW()
            WHERE id = :draw_id
        """)
        db.execute(update_draw_query, {"user_id": winner["user_id"], "draw_id": draw_id})

        # Update winner ticket
        update_winner_query = text("""
            UPDATE lucky_draw_tickets 
            SET is_winner = true, status = 'won'
            WHERE id = :ticket_id
        """)
        db.execute(update_winner_query, {"ticket_id": winner["id"]})

        # Update other tickets as lost
        update_losers_query = text("""
            UPDATE lucky_draw_tickets 
            SET status = 'lost'
            WHERE draw_name = :draw_name AND id != :winner_ticket_id
        """)
        db.execute(update_losers_query, {"draw_name": draw_name, "winner_ticket_id": winner["id"]})

        # Add prize to winner's wallet if prize amount > 0
        if prize_amount > 0:
            # Get winner's wallet
            wallet_query = text("SELECT id FROM wallets WHERE user_id = :user_id")
            wallet_result = db.execute(wallet_query, {"user_id": winner["user_id"]}).mappings().first()
            
            if wallet_result:
                wallet_id = wallet_result["id"]
                
                # Update wallet balance
                update_wallet_query = text("""
                    UPDATE wallets 
                    SET main_balance = main_balance + :prize_amount,
                    updated_at = NOW()
                    WHERE id = :wallet_id
                """)
                db.execute(update_wallet_query, {"prize_amount": prize_amount, "wallet_id": wallet_id})

                # Create wallet transaction
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


# 🆕 NEW: GET WINNERS HISTORY
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