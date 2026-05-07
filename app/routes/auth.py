from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.utils.security import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    RefreshTokenRequest
)

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================
# Register User
# =========================

@router.post(
    "/register",
    response_model=UserResponse
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check Existing Email
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash Password
    hashed_password = hash_password(
        user.password
    )

    # Create User
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =========================
# Login User
# =========================

@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    # Verify Password
    valid_password = verify_password(
        user.password,
        db_user.password
    )

    if not valid_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    # Create Access Token
    access_token = create_access_token(
        data={
            "user_id": db_user.id,
            "email": db_user.email
        }
    )

    # Create Refresh Token
    refresh_token = create_refresh_token(
        data={
            "user_id": db_user.id
        }
    )

    # Store Refresh Token
    db_refresh_token = RefreshToken(
        token=refresh_token,
        user_id=db_user.id
    )

    db.add(db_refresh_token)

    db.commit()
    

    return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
}


# =========================
# Current Logged In User
# =========================

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }


# =========================
# Refresh Access Token
# =========================

@router.post("/refresh")
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid refresh token"
    )

    try:

        payload = jwt.decode(
            request.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Verify Token Type
        if payload.get("type") != "refresh":
            raise credentials_exception

        user_id = payload.get("user_id")

    except JWTError:
        raise credentials_exception

    # Check Database Token
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token,
        RefreshToken.is_revoked == False
    ).first()

    if not db_token:
        raise credentials_exception

    # Create New Access Token
    new_access_token = create_access_token(
        data={
            "user_id": user_id
        }
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


# =========================
# Logout User
# =========================

@router.post("/logout")
def logout_user(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):

    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=404,
            detail="Refresh token not found"
        )

    # Revoke Refresh Token
    db_token.is_revoked = True

    db.commit()

    return {
        "message": "Logged out successfully"
    }