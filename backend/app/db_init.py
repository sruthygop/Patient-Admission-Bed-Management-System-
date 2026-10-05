import urllib.parse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from datetime import datetime, date, timedelta
from app.models.models import User, Ward, Room, Bed, Patient, Admission, DoctorAssignment, Hospital

def create_db_if_not_exists():
    print("Checking database accessibility...")
    url = urllib.parse.urlparse(settings.DATABASE_URL)
    db_name = url.path.lstrip('/')
    username = url.username
    password = url.password
    host = url.hostname
    port = url.port or 5432

    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=username,
            password=password,
            host=host,
            port=port
        )
        conn.close()
        print(f"Database '{db_name}' is accessible. Skipping creation.")
        return
    except Exception as e:
        print(f"Database '{db_name}' is not directly accessible: {e}")

    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=username,
            password=password,
            host=host,
            port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()
        if not exists:
            print(f"Database '{db_name}' does not exist. Creating...")
            cursor.execute(f"CREATE DATABASE {db_name}")
            print(f"Database '{db_name}' created successfully.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking/creating database: {e}")

def seed_database(db: Session):
    print("Seeding database...")

    # 1. Create Super Admin (no hospital — global access)
    super_admin = db.query(User).filter(User.username == "super_admin").first()
    if not super_admin:
        super_admin = User(
            username="super_admin",
            email="superadmin@pabms.com",
            password_hash=get_password_hash("SuperAdmin123!"),
            role="super_admin",
            first_name="Super",
            last_name="Admin",
            is_active=True,
            hospital_id=None
        )
        db.add(super_admin)
        print("Created Super Admin (superadmin@pabms.com / SuperAdmin123!)")

    db.commit()

    # 2. Create Hospital 1 — Settlement Sense Hospital
    hospital1 = db.query(Hospital).filter(Hospital.code == "SS-001").first()
    if not hospital1:
        hospital1 = Hospital(
            name="Settlement Sense Hospital",
            code="SS-001",
            is_active=True
        )
        db.add(hospital1)
        db.flush()
        print("Created Hospital 1: Settlement Sense Hospital (SS-001)")

    hospital1_id = hospital1.id

    # 3. Create Hospital 2 — Metro Care Hospital
    hospital2 = db.query(Hospital).filter(Hospital.code == "MCH-002").first()
    if not hospital2:
        hospital2 = Hospital(
            name="Metro Care Hospital",
            code="MCH-002",
            is_active=True
        )
        db.add(hospital2)
        db.flush()
        print("Created Hospital 2: Metro Care Hospital (MCH-002)")

    hospital2_id = hospital2.id

    db.commit()

    # 4. Seed Hospital 1 Users
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@pabms.com",
            password_hash=get_password_hash("AdminSecurePass123!"),
            role="admin",
            first_name="System",
            last_name="Administrator",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(admin_user)
        print("Created Admin: System Administrator (SS-001)")
    elif not admin_user.hospital_id:
        admin_user.hospital_id = hospital1_id

    doctor1 = db.query(User).filter(User.username == "dr_smith").first()
    if not doctor1:
        doctor1 = User(
            username="dr_smith",
            email="smith@pabms.com",
            password_hash=get_password_hash("DoctorPass123!"),
            role="doctor",
            first_name="John",
            last_name="Smith",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(doctor1)
        print("Created Doctor: Dr. John Smith (SS-001)")
    elif not doctor1.hospital_id:
        doctor1.hospital_id = hospital1_id

    doctor2 = db.query(User).filter(User.username == "dr_jones").first()
    if not doctor2:
        doctor2 = User(
            username="dr_jones",
            email="jones@pabms.com",
            password_hash=get_password_hash("DoctorPass123!"),
            role="doctor",
            first_name="Sarah",
            last_name="Jones",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(doctor2)
        print("Created Doctor: Dr. Sarah Jones (SS-001)")
    elif not doctor2.hospital_id:
        doctor2.hospital_id = hospital1_id

    staff1 = db.query(User).filter(User.username == "staff_reception").first()
    if not staff1:
        staff1 = User(
            username="staff_reception",
            email="reception@pabms.com",
            password_hash=get_password_hash("StaffPass123!"),
            role="receptionist",
            first_name="Jane",
            last_name="Doe",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(staff1)
        print("Created Receptionist: Jane Doe (SS-001)")
    elif not staff1.hospital_id:
        staff1.hospital_id = hospital1_id

    nurse1 = db.query(User).filter(User.username == "nurse_mary").first()
    if not nurse1:
        nurse1 = User(
            username="nurse_mary",
            email="mary@pabms.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="Mary",
            last_name="Johnson",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(nurse1)
        print("Created Nurse: Mary Johnson (SS-001)")
    elif not nurse1.hospital_id:
        nurse1.hospital_id = hospital1_id

    nurse2 = db.query(User).filter(User.username == "nurse_john").first()
    if not nurse2:
        nurse2 = User(
            username="nurse_john",
            email="john.nurse@pabms.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="John",
            last_name="Williams",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(nurse2)
        print("Created Nurse: John Williams (SS-001)")
    elif not nurse2.hospital_id:
        nurse2.hospital_id = hospital1_id

    nurse3 = db.query(User).filter(User.username == "nurse_priya").first()
    if not nurse3:
        nurse3 = User(
            username="nurse_priya",
            email="priya@pabms.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="Priya",
            last_name="Nair",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(nurse3)
        print("Created Nurse: Priya Nair (SS-001)")
    elif not nurse3.hospital_id:
        nurse3.hospital_id = hospital1_id

    cmo1 = db.query(User).filter(User.username == "cmo_john").first()
    if not cmo1:
        cmo1 = User(
            username="cmo_john",
            email="cmo@pabms.com",
            password_hash=get_password_hash("CMOPass123!"),
            role="cmo",
            first_name="Robert",
            last_name="Wilson",
            is_active=True,
            hospital_id=hospital1_id
        )
        db.add(cmo1)
        print("Created CMO: Robert Wilson (SS-001)")
    elif not cmo1.hospital_id:
        cmo1.hospital_id = hospital1_id

    db.commit()

    # 5. Seed Hospital 2 Users
    admin2 = db.query(User).filter(User.username == "admin_metro").first()
    if not admin2:
        admin2 = User(
            username="admin_metro",
            email="admin@metrocare.com",
            password_hash=get_password_hash("MetroAdmin123!"),
            role="admin",
            first_name="Metro",
            last_name="Admin",
            is_active=True,
            hospital_id=hospital2_id
        )
        db.add(admin2)
        print("Created Admin: Metro Admin (MCH-002)")

    doctor_metro = db.query(User).filter(User.username == "dr_metro").first()
    if not doctor_metro:
        doctor_metro = User(
            username="dr_metro",
            email="doctor@metrocare.com",
            password_hash=get_password_hash("DoctorPass123!"),
            role="doctor",
            first_name="Alex",
            last_name="Brown",
            is_active=True,
            hospital_id=hospital2_id
        )
        db.add(doctor_metro)
        print("Created Doctor: Dr. Alex Brown (MCH-002)")

    nurse_metro = db.query(User).filter(User.username == "nurse_metro").first()
    if not nurse_metro:
        nurse_metro = User(
            username="nurse_metro",
            email="nurse@metrocare.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="Lisa",
            last_name="Green",
            is_active=True,
            hospital_id=hospital2_id
        )
        db.add(nurse_metro)
        print("Created Nurse: Lisa Green (MCH-002)")

    db.commit()

    # 6. Create Wards for Hospital 1
    wards_data = [
        {
            "name": "Intensive Care Unit (ICU)",
            "type": "ICU",
            "capacity": 5,
            "rooms": [
                {"room_number": "ICU-1", "room_type": "Private", "beds": ["B1", "B2"]},
                {"room_number": "ICU-2", "room_type": "Private", "beds": ["B1", "B2", "B3"]}
            ]
        },
        {
            "name": "General Ward A",
            "type": "General",
            "capacity": 10,
            "rooms": [
                {"room_number": "101", "room_type": "General", "beds": ["B1", "B2", "B3", "B4", "B5"]},
                {"room_number": "102", "room_type": "General", "beds": ["B1", "B2", "B3", "B4", "B5"]}
            ]
        },
        {
            "name": "Pediatrics Ward",
            "type": "Pediatrics",
            "capacity": 6,
            "rooms": [
                {"room_number": "P-201", "room_type": "Semi-Private", "beds": ["B1", "B2", "B3"]},
                {"room_number": "P-202", "room_type": "Semi-Private", "beds": ["B1", "B2", "B3"]}
            ]
        }
    ]

    for wd in wards_data:
        ward = db.query(Ward).filter(
            Ward.name == wd["name"],
            Ward.hospital_id == hospital1_id
        ).first()
        if not ward:
            ward = Ward(
                name=wd["name"],
                type=wd["type"],
                capacity=wd["capacity"],
                hospital_id=hospital1_id
            )
            db.add(ward)
            db.flush()

            for rm in wd["rooms"]:
                room = Room(
                    ward_id=ward.id,
                    room_number=rm["room_number"],
                    room_type=rm["room_type"],
                    hospital_id=hospital1_id
                )
                db.add(room)
                db.flush()

                for bd_num in rm["beds"]:
                    bed = Bed(
                        room_id=room.id,
                        bed_number=bd_num,
                        status="available",
                        hospital_id=hospital1_id
                    )
                    db.add(bed)
            print(f"Created Ward: {wd['name']} (SS-001)")
        elif not ward.hospital_id:
            ward.hospital_id = hospital1_id

    db.commit()

    # 7. Create Wards for Hospital 2
    metro_wards = [
        {
            "name": "Metro ICU",
            "type": "ICU",
            "capacity": 3,
            "rooms": [
                {"room_number": "MICU-1", "room_type": "Private", "beds": ["B1", "B2", "B3"]}
            ]
        },
        {
            "name": "Metro General Ward",
            "type": "General",
            "capacity": 5,
            "rooms": [
                {"room_number": "MG-101", "room_type": "General", "beds": ["B1", "B2", "B3", "B4", "B5"]}
            ]
        }
    ]

    for wd in metro_wards:
        ward = db.query(Ward).filter(
            Ward.name == wd["name"],
            Ward.hospital_id == hospital2_id
        ).first()
        if not ward:
            ward = Ward(
                name=wd["name"],
                type=wd["type"],
                capacity=wd["capacity"],
                hospital_id=hospital2_id
            )
            db.add(ward)
            db.flush()

            for rm in wd["rooms"]:
                room = Room(
                    ward_id=ward.id,
                    room_number=rm["room_number"],
                    room_type=rm["room_type"],
                    hospital_id=hospital2_id
                )
                db.add(room)
                db.flush()

                for bd_num in rm["beds"]:
                    bed = Bed(
                        room_id=room.id,
                        bed_number=bd_num,
                        status="available",
                        hospital_id=hospital2_id
                    )
                    db.add(bed)
            print(f"Created Ward: {wd['name']} (MCH-002)")

    db.commit()

    
    # 8. Seed Patients for Hospital 1 (Settlement Sense Hospital)
    ss_patients = [
        {
            "first_name": "Jane", "last_name": "Miller", "gender": "Female", 
            "date_of_birth": date(1990, 5, 14), "phone_number": "555-0101", 
            "email": "jane.miller@example.com", "address": "123 Main St",
            "emergency_contact_name": "John Miller", "emergency_contact_phone": "555-9901", "blood_group": "A+"
        },
        {
            "first_name": "Bob", "last_name": "Smith", "gender": "Male", 
            "date_of_birth": date(1982, 11, 23), "phone_number": "555-0102", 
            "email": "bob.smith@example.com", "address": "456 Oak Ave",
            "emergency_contact_name": "Mary Smith", "emergency_contact_phone": "555-9902", "blood_group": "O+"
        },
        {
            "first_name": "Emma", "last_name": "Watson", "gender": "Female", 
            "date_of_birth": date(1995, 3, 10), "phone_number": "555-0103", 
            "email": "emma.watson@example.com", "address": "789 Pine Rd",
            "emergency_contact_name": "Alex Watson", "emergency_contact_phone": "555-9903", "blood_group": "B+"
        },
        {
            "first_name": "Sarah", "last_name": "Connor", "gender": "Female", 
            "date_of_birth": date(1985, 8, 30), "phone_number": "555-0104", 
            "email": "sarah.connor@example.com", "address": "321 Maple St",
            "emergency_contact_name": "Kyle Reese", "emergency_contact_phone": "555-9904", "blood_group": "AB+"
        },
        {
            "first_name": "Nanditha", "last_name": "Ajesh", "gender": "Female", 
            "date_of_birth": date(1998, 1, 15), "phone_number": "555-0105", 
            "email": "nanditha@example.com", "address": "654 Elm St",
            "emergency_contact_name": "Ajesh Kumar", "emergency_contact_phone": "555-9905", "blood_group": "O-"
        },
        {
            "first_name": "Anikha", "last_name": "Menon", "gender": "Female", 
            "date_of_birth": date(2000, 7, 22), "phone_number": "555-0106", 
            "email": "anikha@example.com", "address": "987 Cedar Ln",
            "emergency_contact_name": "Suresh Menon", "emergency_contact_phone": "555-9906", "blood_group": "A-"
        },
        {
            "first_name": "Mekha", "last_name": "Nikhil", "gender": "Female", 
            "date_of_birth": date(1997, 12, 5), "phone_number": "555-0107", 
            "email": "mekha@example.com", "address": "147 Birch Dr",
            "emergency_contact_name": "Nikhil Raj", "emergency_contact_phone": "555-9907", "blood_group": "B-"
        }
    ]

    for p in ss_patients:
        patient = db.query(Patient).filter(
            Patient.hospital_id == hospital1_id,
            (Patient.email == p["email"]) | 
            (
                Patient.first_name.ilike(p["first_name"]) & 
                Patient.last_name.ilike(p["last_name"])
            )
        ).first()
        if not patient:
            patient = Patient(
                first_name=p["first_name"],
                last_name=p["last_name"],
                gender=p["gender"],
                date_of_birth=p["date_of_birth"],
                phone_number=p["phone_number"],
                email=p["email"],
                address=p["address"],
                emergency_contact_name=p["emergency_contact_name"],
                emergency_contact_phone=p["emergency_contact_phone"],
                blood_group=p["blood_group"],
                hospital_id=hospital1_id,
                is_deleted=False
            )
            db.add(patient)
    print("Seeded patients for Hospital 1 (SS-001)")

    # 9. Seed Patients for Hospital 2 (Metro Care Hospital)
    metro_patients = [
        {
            "first_name": "Alice", "last_name": "Smith", "gender": "Female", 
            "date_of_birth": date(1992, 4, 18), "phone_number": "555-0201", 
            "email": "alice.smith@example.com", "address": "555 Metro Way",
            "emergency_contact_name": "Tom Smith", "emergency_contact_phone": "555-9908", "blood_group": "O+"
        },
        {
            "first_name": "David", "last_name": "Miller", "gender": "Male", 
            "date_of_birth": date(1988, 9, 12), "phone_number": "555-0202", 
            "email": "david.miller@example.com", "address": "777 City Blvd",
            "emergency_contact_name": "Grace Miller", "emergency_contact_phone": "555-9909", "blood_group": "A+"
        }
    ]

    for p in metro_patients:
        patient = db.query(Patient).filter(
            Patient.hospital_id == hospital2_id,
            (Patient.email == p["email"]) | 
            (
                Patient.first_name.ilike(p["first_name"]) & 
                Patient.last_name.ilike(p["last_name"])
            )
        ).first()
        if not patient:
            patient = Patient(
                first_name=p["first_name"],
                last_name=p["last_name"],
                gender=p["gender"],
                date_of_birth=p["date_of_birth"],
                phone_number=p["phone_number"],
                email=p["email"],
                address=p["address"],
                emergency_contact_name=p["emergency_contact_name"],
                emergency_contact_phone=p["emergency_contact_phone"],
                blood_group=p["blood_group"],
                hospital_id=hospital2_id,
                is_deleted=False
            )
            db.add(patient)
    print("Seeded patients for Hospital 2 (MCH-002)")
    # Backfill any remaining unassigned patients to Hospital 1
    unassigned_patients = db.query(Patient).filter(Patient.hospital_id == None).all()
    for p in unassigned_patients:
        p.hospital_id = hospital1_id

    db.commit()
    print("Database seeding completed successfully!")
    print("\n=== DEFAULT CREDENTIALS ===")
    print("Super Admin: superadmin@pabms.com / SuperAdmin123!")
    print("--- Hospital 1 (SS-001) ---")
    print("Admin: admin@pabms.com / AdminSecurePass123!")
    print("CMO: cmo@pabms.com / CMOPass123!")
    print("Doctor: smith@pabms.com / DoctorPass123!")
    print("Nurse: mary@pabms.com / NursePass123!")
    print("Receptionist: reception@pabms.com / StaffPass123!")
    print("--- Hospital 2 (MCH-002) ---")
    print("Admin: admin@metrocare.com / MetroAdmin123!")
    print("Doctor: doctor@metrocare.com / DoctorPass123!")
    print("Nurse: nurse@metrocare.com / NursePass123!")

def main():
    create_db_if_not_exists()
    print("Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()