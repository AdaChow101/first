import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pymongo import MongoClient

# 1. 加载 .env 文件中的配置
load_dotenv()

# --- PostgreSQL 配置 (用于核心业务数据) ---
PG_URL = os.getenv("DATABASE_URL")
if not PG_URL:
    raise ValueError("未找到 DATABASE_URL，请检查 .env 文件")

# 创建 SQL 引擎
engine = create_engine(PG_URL)
# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 创建模型基类 (所有的 SQL 表都将继承它)
Base = declarative_base()

# 获取 SQL 数据库会话的依赖函数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MongoDB 配置 (用于题库和日志) ---
MONGO_URL = os.getenv("MONGO_URI")
if not MONGO_URL:
    raise ValueError("未找到 MONGO_URI，请检查 .env 文件")

# 创建 Mongo 客户端
mongo_client = MongoClient(MONGO_URL)
# 指定数据库名 (如果没有会自动创建)
mongo_db = mongo_client["gre_content_db"]

# 测试连接函数
def check_connections():
    status = {"postgres": False, "mongo": False}
    
    # 检查 SQL
    try:
        with engine.connect() as connection:
            print("✅ PostgreSQL 连接成功!")
            status["postgres"] = True
    except Exception as e:
        print(f"❌ PostgreSQL 连接失败: {e}")

    # 检查 Mongo
    try:
        mongo_client.admin.command('ping')
        print("✅ MongoDB 连接成功!")
        status["mongo"] = True
    except Exception as e:
        print(f"❌ MongoDB 连接失败: {e}")
        
    return status
