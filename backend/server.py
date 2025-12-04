from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pandas as pd
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRole(BaseModel):
    ADMIN: str = "admin"
    TEACHER: str = "teacher"
    STUDENT: str = "student"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    role: str  # admin, teacher, student
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    password: str
    role: str
    class_name: Optional[str] = None  # For students

class UserLogin(BaseModel):
    username: str  # Can be name or email
    password: str
    class_name: Optional[str] = None  # Required for students

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    class_name: str
    total_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    class_name: str
    user_id: Optional[str] = None

class BehaviorRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    teacher_id: str
    behavior_type: str  # positive or negative
    points: int  # 1-10
    description: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BehaviorRecordCreate(BaseModel):
    student_id: str
    behavior_type: str
    points: int
    description: str

class Statistics(BaseModel):
    total_students: int
    total_positive_records: int
    total_negative_records: int
    top_students: List[dict]
    recent_activities: List[dict]

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # For non-students, email is required
    if user_data.role != "student" and not user_data.email:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مطلوب للمعلمات والإدارة")
    
    # For students, create auto email if not provided
    if user_data.role == "student" and not user_data.email:
        # Create unique email from name and class
        safe_name = user_data.name.replace(" ", "_").lower()
        safe_class = user_data.class_name.replace("/", "_") if user_data.class_name else "noclass"
        user_data.email = f"{safe_name}_{safe_class}@tamayyuz.local"
    
    # Check if email exists (if provided or generated)
    if user_data.email:
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    # Check if student with same name and class exists
    if user_data.role == "student" and user_data.class_name:
        existing_student = await db.students.find_one({
            "name": user_data.name,
            "class_name": user_data.class_name
        })
        if existing_student:
            raise HTTPException(status_code=400, detail="الطالبة مسجلة مسبقاً في نفس الصف والفصل")
    else:
        # For non-students, check if name exists
        existing_name = await db.users.find_one({"name": user_data.name})
        if existing_name:
            raise HTTPException(status_code=400, detail="الاسم مسجل مسبقاً")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token({"sub": user.id, "role": user.role})
    
    # If student role, create student record
    if user_data.role == "student":
        student = Student(
            user_id=user.id,
            name=user_data.name,
            class_name=user_data.class_name or "",
            total_points=0
        )
        student_doc = student.model_dump()
        student_doc['created_at'] = student_doc['created_at'].isoformat()
        await db.students.insert_one(student_doc)
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    # Try to find user by name first, then by email
    user = await db.users.find_one({"name": credentials.username}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"email": credentials.username}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    # For students, verify class_name as well
    if user['role'] == 'student' and credentials.class_name:
        student = await db.students.find_one({"user_id": user['id']}, {"_id": 0})
        if not student or student.get('class_name') != credentials.class_name:
            raise HTTPException(status_code=401, detail="الصف أو الفصل غير صحيح")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    # Create access token
    access_token = create_access_token({"sub": user['id'], "role": user['role']})
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password_hash'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**{k: v for k, v in current_user.items() if k != 'password_hash'})

# Student Routes
@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: dict = Depends(get_current_user)):
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for student in students:
        if isinstance(student.get('created_at'), str):
            student['created_at'] = datetime.fromisoformat(student['created_at'])
    return students

@api_router.post("/students", response_model=Student)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'teacher']:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    # Check if student with same name and class already exists
    existing_student = await db.students.find_one({
        "name": student_data.name,
        "class_name": student_data.class_name
    })
    if existing_student:
        raise HTTPException(status_code=400, detail="الطالبة موجودة مسبقاً في نفس الصف")
    
    # If no user_id provided, create a user account automatically
    user_id = student_data.user_id
    if not user_id:
        # Create auto email
        safe_name = student_data.name.replace(" ", "_").lower()
        safe_class = student_data.class_name.replace("/", "_")
        email = f"{safe_name}_{safe_class}@tamayyuz.local"
        
        # Default password
        default_password = "123456"
        
        # Create user
        user = User(
            name=student_data.name,
            email=email,
            role="student"
        )
        
        user_doc = user.model_dump()
        user_doc['password_hash'] = hash_password(default_password)
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        
        await db.users.insert_one(user_doc)
        user_id = user.id
    
    # Create student record
    student = Student(
        name=student_data.name,
        class_name=student_data.class_name,
        user_id=user_id,
        total_points=0
    )
    
    student_doc = student.model_dump()
    student_doc['created_at'] = student_doc['created_at'].isoformat()
    
    await db.students.insert_one(student_doc)
    return student

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالبة غير موجودة")
    
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    
    return Student(**student)

@api_router.get("/students/user/{user_id}", response_model=Student)
async def get_student_by_user(user_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالبة غير موجودة")
    
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    
    return Student(**student)

# Behavior Routes
@api_router.post("/behavior", response_model=BehaviorRecord)
async def create_behavior_record(record_data: BehaviorRecordCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'teacher']:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    if record_data.points < 1 or record_data.points > 10:
        raise HTTPException(status_code=400, detail="النقاط يجب أن تكون بين 1 و 10")
    
    record = BehaviorRecord(
        student_id=record_data.student_id,
        teacher_id=current_user['id'],
        behavior_type=record_data.behavior_type,
        points=record_data.points,
        description=record_data.description
    )
    
    record_doc = record.model_dump()
    record_doc['date'] = record_doc['date'].isoformat()
    record_doc['created_at'] = record_doc['created_at'].isoformat()
    
    await db.behavior_records.insert_one(record_doc)
    
    # Update student's total points
    student = await db.students.find_one({"id": record_data.student_id})
    if student:
        points_change = record_data.points if record_data.behavior_type == "positive" else -record_data.points
        new_total = student.get('total_points', 0) + points_change
        await db.students.update_one(
            {"id": record_data.student_id},
            {"$set": {"total_points": new_total}}
        )
    
    return record

@api_router.get("/behavior/student/{student_id}", response_model=List[BehaviorRecord])
async def get_student_behavior(student_id: str, current_user: dict = Depends(get_current_user)):
    records = await db.behavior_records.find({"student_id": student_id}, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for record in records:
        if isinstance(record.get('date'), str):
            record['date'] = datetime.fromisoformat(record['date'])
        if isinstance(record.get('created_at'), str):
            record['created_at'] = datetime.fromisoformat(record['created_at'])
    
    return records

# Statistics Route
@api_router.get("/statistics", response_model=Statistics)
async def get_statistics(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    # Total students
    total_students = await db.students.count_documents({})
    
    # Total positive/negative records
    total_positive = await db.behavior_records.count_documents({"behavior_type": "positive"})
    total_negative = await db.behavior_records.count_documents({"behavior_type": "negative"})
    
    # Top students
    top_students_cursor = db.students.find({}, {"_id": 0}).sort("total_points", -1).limit(5)
    top_students = await top_students_cursor.to_list(5)
    
    # Recent activities
    recent_cursor = db.behavior_records.find({}, {"_id": 0}).sort("date", -1).limit(10)
    recent_activities = await recent_cursor.to_list(10)
    
    return Statistics(
        total_students=total_students,
        total_positive_records=total_positive,
        total_negative_records=total_negative,
        top_students=top_students,
        recent_activities=recent_activities
    )

@api_router.post("/students/import", response_model=dict)
async def import_students(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'teacher']:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="يجب أن يكون الملف من نوع Excel (.xlsx أو .xls)")
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        if 'الاسم' not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail="الملف يجب أن يحتوي على عمود 'الاسم'"
            )
        
        if 'الصف' not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail="الملف يجب أن يحتوي على عمود 'الصف' (مثال: 1/أ، 2/ب)"
            )
        
        added_count = 0
        skipped_count = 0
        errors = []
        default_password_used = False
        
        for index, row in df.iterrows():
            try:
                name = str(row['الاسم']).strip()
                
                # Skip empty rows
                if not name or name == 'nan':
                    skipped_count += 1
                    continue
                
                # Get class_name from Excel
                class_name = str(row['الصف']).strip() if 'الصف' in row and pd.notna(row['الصف']) else None
                
                if not class_name or class_name == 'nan':
                    errors.append(f"الصف {index + 2}: الطالبة {name} - الصف والفصل مفقودان")
                    skipped_count += 1
                    continue
                
                # Validate class_name format (should be like "1/أ")
                if '/' not in class_name:
                    errors.append(f"الصف {index + 2}: الطالبة {name} - تنسيق الصف غير صحيح (يجب أن يكون مثل: 1/أ)")
                    skipped_count += 1
                    continue
                
                # Get password from Excel or use default
                if 'كلمة المرور' in df.columns and pd.notna(row.get('كلمة المرور')):
                    password = str(row['كلمة المرور']).strip()
                else:
                    password = "123456"  # Default password
                    default_password_used = True
                
                # Check if student with same name and class already exists
                existing_student = await db.students.find_one({
                    "name": name,
                    "class_name": class_name
                })
                if existing_student:
                    skipped_count += 1
                    errors.append(f"الطالبة {name} في الصف {class_name} موجودة مسبقاً")
                    continue
                
                # Create auto email for student
                safe_name = name.replace(" ", "_").lower()
                safe_class = class_name.replace("/", "_")
                email = f"{safe_name}_{safe_class}@tamayyuz.local"
                
                # Create user
                user = User(
                    name=name,
                    email=email,
                    role="student"
                )
                
                user_doc = user.model_dump()
                user_doc['password_hash'] = hash_password(password)
                user_doc['created_at'] = user_doc['created_at'].isoformat()
                
                await db.users.insert_one(user_doc)
                
                # Create student record
                student = Student(
                    user_id=user.id,
                    name=name,
                    class_name=class_name,
                    total_points=0
                )
                student_doc = student.model_dump()
                student_doc['created_at'] = student_doc['created_at'].isoformat()
                await db.students.insert_one(student_doc)
                
                added_count += 1
                
            except Exception as e:
                errors.append(f"خطأ في الصف {index + 2}: {str(e)}")
                skipped_count += 1
        
        # Prepare success message
        message = f"تم استيراد {added_count} طالبة بنجاح"
        if default_password_used:
            message += " | كلمة المرور الافتراضية: 123456"
        
        return {
            "success": True,
            "added_count": added_count,
            "skipped_count": skipped_count,
            "message": message,
            "errors": errors if errors else []
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"فشل قراءة الملف: {str(e)}")

@api_router.delete("/behavior/{behavior_id}")
async def delete_behavior(behavior_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'teacher']:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    # Get behavior record
    behavior = await db.behavior_records.find_one({"id": behavior_id}, {"_id": 0})
    if not behavior:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    
    # Update student's total points (reverse the behavior)
    student = await db.students.find_one({"id": behavior['student_id']})
    if student:
        points_change = -behavior['points'] if behavior['behavior_type'] == "positive" else behavior['points']
        new_total = student.get('total_points', 0) + points_change
        await db.students.update_one(
            {"id": behavior['student_id']},
            {"$set": {"total_points": new_total}}
        )
    
    # Delete behavior record
    await db.behavior_records.delete_one({"id": behavior_id})
    
    return {"success": True, "message": "تم حذف السجل بنجاح"}

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['admin', 'teacher']:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    # Get student to get user_id
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالبة غير موجودة")
    
    # Delete student's behavior records
    await db.behavior_records.delete_many({"student_id": student_id})
    
    # Delete student record
    await db.students.delete_one({"id": student_id})
    
    # Delete user account if exists
    if student.get('user_id'):
        await db.users.delete_one({"id": student['user_id']})
    
    return {"success": True, "message": "تم حذف الطالبة بنجاح"}

@api_router.get("/students/top/by-class")
async def get_top_students_by_class(current_user: dict = Depends(get_current_user)):
    # Get all students
    students = await db.students.find({}, {"_id": 0}).to_list(10000)
    
    # Group by class
    classes_dict = {}
    for student in students:
        class_name = student.get('class_name', '')
        if class_name not in classes_dict:
            classes_dict[class_name] = []
        classes_dict[class_name].append(student)
    
    # Get top 5 for each class
    result = {}
    for class_name, class_students in classes_dict.items():
        # Sort by total_points descending
        sorted_students = sorted(class_students, key=lambda x: x.get('total_points', 0), reverse=True)
        result[class_name] = sorted_students[:5]
    
    return result

@api_router.get("/reports/{report_type}")
async def get_report(
    report_type: str,
    class_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['admin', 'teacher']:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    if report_type not in ['weekly', 'monthly']:
        raise HTTPException(status_code=400, detail="نوع التقرير يجب أن يكون weekly أو monthly")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if report_type == 'weekly':
        start_date = now - timedelta(days=7)
    else:  # monthly
        start_date = now - timedelta(days=30)
    
    # Build query
    query = {"date": {"$gte": start_date.isoformat()}}
    
    # Get students filter
    students_query = {}
    if class_name:
        students_query["class_name"] = class_name
    
    students = await db.students.find(students_query, {"_id": 0}).to_list(10000)
    student_ids = [s['id'] for s in students]
    
    if student_ids:
        query["student_id"] = {"$in": student_ids}
    
    # Get behavior records
    behaviors = await db.behavior_records.find(query, {"_id": 0}).to_list(10000)
    
    # Calculate statistics
    report_data = []
    for student in students:
        student_behaviors = [b for b in behaviors if b['student_id'] == student['id']]
        
        positive_behaviors = [b for b in student_behaviors if b['behavior_type'] == 'positive']
        negative_behaviors = [b for b in student_behaviors if b['behavior_type'] == 'negative']
        
        positive_count = len(positive_behaviors)
        negative_count = len(negative_behaviors)
        positive_points = sum(b['points'] for b in positive_behaviors)
        negative_points = sum(b['points'] for b in negative_behaviors)
        
        report_data.append({
            "student_id": student['id'],
            "student_name": student['name'],
            "class_name": student['class_name'],
            "total_points": student.get('total_points', 0),
            "positive_count": positive_count,
            "negative_count": negative_count,
            "positive_points": positive_points,
            "negative_points": negative_points,
            "net_points": positive_points - negative_points,
            "total_behaviors": positive_count + negative_count
        })
    
    # Sort by total_points descending
    report_data.sort(key=lambda x: x['total_points'], reverse=True)
    
    return {
        "report_type": report_type,
        "class_name": class_name,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "total_students": len(report_data),
        "data": report_data
    }

@api_router.get("/")
async def root():
    return {"message": "مرحباً بك في منصة رواد التميز"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()