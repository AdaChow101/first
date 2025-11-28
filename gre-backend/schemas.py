from typing import List, Optional
from pydantic import BaseModel, EmailStr

# ================== 1. 用户模型 (User) ==================
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool

    class Config:
        from_attributes = True

# ================== 2. 认证模型 (Token) ==================
class Token(BaseModel):
    """返回给前端的 Token 结构"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """解密 Token 后拿到的数据"""
    email: Optional[str] = None

# ================== 3. 题库模型 (Question) ==================
# ⚠️ 之前报错就是因为缺了这部分代码

class QuestionBase(BaseModel):
    """题目基础字段"""
    title: str               # 标题
    content: str             # 题干 (支持 LaTeX)
    type: str = "single_choice"
    difficulty: str = "medium"
    tags: List[str] = []
    
    # 选项: [{"id": "A", "text": "20"}, ...]
    options: Optional[List[dict]] = [] 

    correct_answer: str      # 正确选项 ID
    analysis: Optional[str] = None # 解析

class QuestionCreate(QuestionBase):
    """录入题目时的数据 (目前和基础字段一致)"""
    pass

class QuestionResponse(QuestionBase):
    """返回给前端的数据"""
    id: str  # MongoDB 的 ObjectId 转为字符串

    class Config:
        from_attributes = True
