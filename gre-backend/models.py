'''
v1.0
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """
    SQLAlchemy 用户模型
    对应 PostgreSQL 数据库中的 'users' 表
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # 这里的 password 存储的是哈希值，不是明文
    hashed_password = Column(String, nullable=False)
    # 角色: student, teacher, admin
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
'''

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# ---------------------- 1. 用户表 ----------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student") # student, admin, teacher
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系关联：一个用户可以有多次考试记录
    # back_populates 让我们可以通过 user.exam_sessions 访问他的所有考试
    exam_sessions = relationship("ExamSession", back_populates="user")
    # 关系关联：一个用户可以购买多门课程
    enrollments = relationship("Enrollment", back_populates="user")

# ---------------------- 2. 课程体系表 ----------------------
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    cover_image = Column(String, nullable=True) # 封面图 URL
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系：一门课包含多个章节
    chapters = relationship("Chapter", back_populates="course")
    # 关系：一门课可以被多人购买
    enrollments = relationship("Enrollment", back_populates="course")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id")) # 外键指向 Course 表
    title = Column(String, nullable=False)
    order_index = Column(Integer, default=0) # 用于章节排序 (第1章, 第2章...)

    # 反向关联
    course = relationship("Course", back_populates="chapters")

class Enrollment(Base):
    """购买记录表 (连接用户和课程)"""
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

# ---------------------- 3. 考试业务表 ----------------------
class ExamSession(Base):
    """
    考试会话表
    记录谁(User)在什么时候(Time)考了一次试，得了多少分(Score)。
    具体的每一道题做对了还是做错了，存 MongoDB 的 logs 里，这里只存宏观结果。
    """
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # 关联到 MongoDB 里的那套试卷 ID (字符串)
    exam_template_id = Column(String, nullable=True) 
    
    status = Column(String, default="in_progress") # in_progress, completed
    total_score = Column(Integer, default=0)
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    # 反向关联
    user = relationship("User", back_populates="exam_sessions")
