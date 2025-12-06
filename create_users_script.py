"""
Script to create 30 teachers and 50 students
Run with: python manage.py shell < create_users_script.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import transaction
from users.models import User, UserRole
from teachers.models import TeacherProfile
from students.models import StudentProfile
from superadmin.models import School, SchoolUser
import random
from datetime import date, timedelta

# Teacher first names
TEACHER_FIRST_NAMES = [
    "Rajesh", "Sunita", "Amit", "Priya", "Vikram", "Neha", "Sanjay", "Kavita", 
    "Arun", "Deepa", "Manoj", "Anita", "Suresh", "Rekha", "Ramesh", "Geeta",
    "Ashok", "Meena", "Vinod", "Pooja", "Dinesh", "Ritu", "Rakesh", "Suman",
    "Prakash", "Savita", "Naresh", "Kiran", "Mukesh", "Shilpa"
]

# Teacher last names
TEACHER_LAST_NAMES = [
    "Sharma", "Verma", "Singh", "Kumar", "Gupta", "Patel", "Yadav", "Reddy",
    "Mishra", "Joshi", "Agarwal", "Mehta", "Chauhan", "Pandey", "Tiwari"
]

# Student first names
STUDENT_FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Ayaan", "Atharva",
    "Krishna", "Ishaan", "Shaurya", "Dhruv", "Kabir", "Rudra", "Advait", "Arnav",
    "Ananya", "Aadhya", "Diya", "Pari", "Saanvi", "Myra", "Aanya", "Navya",
    "Kiara", "Avni", "Riya", "Sara", "Isha", "Anvi", "Prisha", "Tara",
    "Rohan", "Yash", "Rahul", "Akash", "Kunal", "Nikhil", "Siddharth", "Varun",
    "Shreya", "Nisha", "Tanvi", "Palak", "Simran", "Ritika", "Divya", "Sonia",
    "Mohit", "Gaurav"
]

# Student last names
STUDENT_LAST_NAMES = [
    "Sharma", "Verma", "Singh", "Kumar", "Gupta", "Patel", "Yadav", "Reddy",
    "Mishra", "Joshi", "Agarwal", "Mehta", "Chauhan", "Pandey", "Tiwari",
    "Saxena", "Kapoor", "Malhotra", "Bhatia", "Chopra"
]

# Qualifications
QUALIFICATIONS = ["B.Ed", "M.Ed", "B.A", "M.A", "B.Sc", "M.Sc", "PhD"]

# Get schools (using the admin's school and distribute across schools)
schools = list(School.objects.all()[:5])
if not schools:
    print("No schools found! Please create schools first.")
    sys.exit(1)

print(f"Found {len(schools)} schools")
print("=" * 60)

# Storage for credentials
credentials = {
    "teachers": [],
    "students": []
}

def generate_password():
    """Generate a simple password"""
    return f"Pass@{random.randint(1000, 9999)}"

def generate_phone():
    """Generate a random phone number"""
    return f"+91{random.randint(7000000000, 9999999999)}"

def generate_dob_teacher():
    """Generate DOB for teacher (25-55 years old)"""
    age = random.randint(25, 55)
    return date.today() - timedelta(days=age*365 + random.randint(0, 365))

def generate_dob_student():
    """Generate DOB for student (10-18 years old)"""
    age = random.randint(10, 18)
    return date.today() - timedelta(days=age*365 + random.randint(0, 365))

# Create Teachers
print("\n📚 Creating 30 Teachers...")
print("-" * 60)

with transaction.atomic():
    for i in range(30):
        first_name = TEACHER_FIRST_NAMES[i]
        last_name = random.choice(TEACHER_LAST_NAMES)
        email = f"teacher{i+1}@sarathilearn.com"
        password = generate_password()
        phone = generate_phone()
        employee_id = f"TCH-{2024}{str(i+1).zfill(3)}"
        school = schools[i % len(schools)]  # Distribute across schools
        qualification = random.choice(QUALIFICATIONS)
        experience = random.randint(1, 20)
        dob = generate_dob_teacher()
        gender = "M" if i < 15 else "F"  # 15 male, 15 female

        # Create user
        user = User.objects.create(
            email=email,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=dob,
            gender=gender,
            status='ACTIVE',
            is_active=True
        )
        user.set_password(password)
        user.save()

        # Create role
        UserRole.objects.create(user=user, role_type='TEACHER')

        # Create teacher profile
        teacher_profile = TeacherProfile.objects.create(
            user=user,
            school=school,
            employee_id=employee_id,
            qualification=qualification,
            experience_years=experience
        )

        # Create school user relationship
        SchoolUser.objects.create(school=school, user=user)

        credentials["teachers"].append({
            "name": f"{first_name} {last_name}",
            "email": email,
            "password": password,
            "phone": phone,
            "employee_id": employee_id,
            "school": school.name,
            "qualification": qualification,
            "experience": experience
        })

        print(f"  ✓ Created teacher: {first_name} {last_name} ({email})")

print(f"\n✅ Created 30 teachers successfully!")

# Create Students
print("\n🎓 Creating 50 Students...")
print("-" * 60)

with transaction.atomic():
    for i in range(50):
        first_name = STUDENT_FIRST_NAMES[i]
        last_name = random.choice(STUDENT_LAST_NAMES)
        email = f"student{i+1}@sarathilearn.com"
        password = generate_password()
        phone = generate_phone()
        udise_student_id = f"STU{2024}{str(i+1).zfill(4)}"
        roll_no = str(random.randint(1, 60))
        school = schools[i % len(schools)]  # Distribute across schools
        dob = generate_dob_student()
        gender = "M" if i < 25 else "F"  # 25 male, 25 female
        parent_name = f"{random.choice(['Mr.', 'Mrs.'])} {random.choice(STUDENT_LAST_NAMES)}"
        parent_phone = generate_phone()

        # Create user
        user = User.objects.create(
            email=email,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=dob,
            gender=gender,
            status='ACTIVE',
            is_active=True
        )
        user.set_password(password)
        user.save()

        # Create role
        UserRole.objects.create(user=user, role_type='STUDENT')

        # Create student profile
        student_profile = StudentProfile.objects.create(
            user=user,
            school=school,
            udise_student_id=udise_student_id,
            roll_no=roll_no,
            parent_name=parent_name,
            parent_phone=parent_phone,
            ai_quota_limit=100,
            ai_quota_used=random.randint(0, 50)
        )

        # Create school user relationship
        SchoolUser.objects.create(school=school, user=user)

        credentials["students"].append({
            "name": f"{first_name} {last_name}",
            "email": email,
            "password": password,
            "phone": phone,
            "udise_student_id": udise_student_id,
            "roll_no": roll_no,
            "school": school.name,
            "parent_name": parent_name,
            "parent_phone": parent_phone
        })

        print(f"  ✓ Created student: {first_name} {last_name} ({email})")

print(f"\n✅ Created 50 students successfully!")

# Save credentials to text file
print("\n📝 Saving credentials to file...")

with open("user_credentials.txt", "w") as f:
    f.write("=" * 80 + "\n")
    f.write("SARATHI LEARN - USER CREDENTIALS\n")
    f.write("Generated on: " + str(date.today()) + "\n")
    f.write("=" * 80 + "\n\n")

    # Teachers Section
    f.write("=" * 80 + "\n")
    f.write("TEACHERS (30)\n")
    f.write("=" * 80 + "\n\n")

    for idx, teacher in enumerate(credentials["teachers"], 1):
        f.write(f"Teacher #{idx}\n")
        f.write("-" * 40 + "\n")
        f.write(f"Name:         {teacher['name']}\n")
        f.write(f"Email:        {teacher['email']}\n")
        f.write(f"Password:     {teacher['password']}\n")
        f.write(f"Phone:        {teacher['phone']}\n")
        f.write(f"Employee ID:  {teacher['employee_id']}\n")
        f.write(f"School:       {teacher['school']}\n")
        f.write(f"Qualification:{teacher['qualification']}\n")
        f.write(f"Experience:   {teacher['experience']} years\n")
        f.write("\n")

    # Students Section
    f.write("\n" + "=" * 80 + "\n")
    f.write("STUDENTS (50)\n")
    f.write("=" * 80 + "\n\n")

    for idx, student in enumerate(credentials["students"], 1):
        f.write(f"Student #{idx}\n")
        f.write("-" * 40 + "\n")
        f.write(f"Name:           {student['name']}\n")
        f.write(f"Email:          {student['email']}\n")
        f.write(f"Password:       {student['password']}\n")
        f.write(f"Phone:          {student['phone']}\n")
        f.write(f"UDISE ID:       {student['udise_student_id']}\n")
        f.write(f"Roll No:        {student['roll_no']}\n")
        f.write(f"School:         {student['school']}\n")
        f.write(f"Parent Name:    {student['parent_name']}\n")
        f.write(f"Parent Phone:   {student['parent_phone']}\n")
        f.write("\n")

    f.write("=" * 80 + "\n")
    f.write("END OF FILE\n")
    f.write("=" * 80 + "\n")

print("✅ Credentials saved to: user_credentials.txt")
print("\n" + "=" * 60)
print("🎉 ALL DONE!")
print("=" * 60)
print(f"✓ 30 Teachers created")
print(f"✓ 50 Students created")
print(f"✓ Credentials saved to user_credentials.txt")
print("=" * 60)

