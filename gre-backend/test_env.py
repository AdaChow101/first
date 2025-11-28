# 新建 test_env.py 放在项目根目录
import os
from dotenv import load_dotenv

print("当前目录:", os.getcwd())
print("目录下的文件:", os.listdir("."))

load_dotenv()
db_url = os.getenv("DATABASE_URL")
print("读取到的 DATABASE_URL:", db_url)
