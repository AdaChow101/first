import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
import schemas
from database import get_db

load_dotenv()

# --- 配置 ---
SECRET_KEY = os.getenv("SECRET_KEY", "changeme_this_is_unsafe_secret") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 

# --- 核心修复：加密算法配置 ---
# 我们把 schemes 改为 ["pbkdf2_sha256", "bcrypt"]
# 并且 default="pbkdf2_sha256"
# 这样就彻底绕过了 72 字节的限制
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"], 
    default="pbkdf2_sha256", 
    deprecated="auto"
)

# 定义 OAuth2 模式
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- 工具函数 ---

def verify_password(plain_password, hashed_password):
    """验证密码是否正确"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """生成密码哈希"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """生成 JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """验证当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
        
    return user
