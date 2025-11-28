import os
import traceback
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware  # 引入 CORS
from sqlalchemy.orm import Session
from bson import ObjectId # 用于处理 MongoDB ID

# 引入我们定义的模块
import models
import schemas
import auth
from database import engine, get_db, check_connections, mongo_db

load_dotenv()

# --- 1. 数据库初始化 ---
try:
    url = str(engine.url)
    if url.startswith("postgres://"):
        print("⚠️ 警告: 检测到旧版 connection string，建议改为 postgresql://")
    models.Base.metadata.create_all(bind=engine)
    print("✅ SQL 表结构同步完成")
except Exception as e:
    print(f"❌ SQL 表结构同步失败: {e}")

app = FastAPI(
    title="GRE Math Platform API",
    description="后端 API 服务：包含用户注册、登录、题库(MongoDB)与跨域配置",
    version="1.0.0"
)

# --- 2. CORS 跨域配置 (允许前端访问) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有来源，生产环境请填具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. 全局异常捕获中间件 ---
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        print("\n❌ ------------------- 严重错误捕获 -------------------")
        traceback.print_exc()
        print("-------------------------------------------------------\n")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "服务器内部错误",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        )

# ================== 核心业务接口 ==================

# 1. 登录接口
@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 注意：form_data.username 接收的是邮箱
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 2. 注册接口
@app.post("/users/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd, role="student")
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise e

# 3. 受保护的用户信息接口
@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ================== 题库接口 (MongoDB) ==================

# 4. 录入题目 (需要登录)
@app.post("/questions", response_model=schemas.QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(question: schemas.QuestionCreate, current_user: models.User = Depends(auth.get_current_user)):
    """
    录入题目到 MongoDB
    """
    if mongo_db is None:
        raise HTTPException(status_code=503, detail="MongoDB 未连接")

    # 转成字典并添加元数据
    question_dict = question.dict()
    question_dict.update({
        "created_by": current_user.id,
        "created_at": datetime.utcnow()
    })

    try:
        result = mongo_db.questions.insert_one(question_dict)
        # 将 ObjectId 转为字符串以便返回
        question_dict["id"] = str(result.inserted_id)
        return question_dict
    except Exception as e:
        print(f"❌ 存题失败: {e}")
        raise HTTPException(status_code=500, detail="题目录入失败")

# 5. 获取题目列表 (公开)
@app.get("/questions", response_model=list[schemas.QuestionResponse])
def get_questions(limit: int = 10, skip: int = 0):
    """
    获取题目列表
    """
    if mongo_db is None:
        raise HTTPException(status_code=503, detail="MongoDB 未连接")
    
    questions_list = []
    cursor = mongo_db.questions.find().skip(skip).limit(limit)
    
    for q in cursor:
        q["id"] = str(q["_id"]) # ObjectId -> String
        questions_list.append(q)
        
    return questions_list

# ================== 系统接口 ==================

@app.on_event("startup")
async def startup_event():
    check_connections()

@app.get("/")
def read_root():
    return {"message": "GRE Math API is running"}

@app.get("/health-check")
def health_check():
    return {"database_status": check_connections()}

@app.get("/debug/reset-db")
def reset_database():
    try:
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)
        return {"message": "数据库重置成功"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("🚀 服务器启动中: http://127.0.0.1:8001/docs")
    uvicorn.run(app, host="127.0.0.1", port=8001)
