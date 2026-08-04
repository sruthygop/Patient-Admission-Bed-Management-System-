import urllib.parse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from datetime import datetime, date, timedelta
from app.models.models import User, Ward, Room, Bed, Patient, Admission, DoctorAssignment

def create_db_if_not_exists():
    """Check if the target database is accessible. If not, attempt to create it."""
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
        print("Attempting to connect to default 'postgres' database to create it...")

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
        else:
            print(f"Database '{db_name}' exists but was not accessible previously.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking/creating database via postgres: {e}")
        print("Attempting to proceed with schema creation directly (assuming DB exists)...")

def seed_database(db: Session):
    """Seed default admin, users, wards, rooms, and beds."""
    print("Seeding database...")
    
    # 1. Create Default Admin User if not exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@pabms.com",
            password_hash=get_password_hash("AdminSecurePass123!"),
            role="admin",
            first_name="System",
            last_name="Administrator",
            is_active=True
        )
        db.add(admin_user)
        print("Created default admin user (admin / AdminSecurePass123!)")

    # 2. Create Doctors
    doctor1 = db.query(User).filter(User.username == "dr_smith").first()
    if not doctor1:
        doctor1 = User(
            username="dr_smith",
            email="smith@pabms.com",
            password_hash=get_password_hash("DoctorPass123!"),
            role="doctor",
            first_name="John",
            last_name="Smith",
            is_active=True
        )
        db.add(doctor1)
        print("Created doctor user: Dr. John Smith (dr_smith / DoctorPass123!)")

    doctor2 = db.query(User).filter(User.username == "dr_jones").first()
    if not doctor2:
        doctor2 = User(
            username="dr_jones",
            email="jones@pabms.com",
            password_hash=get_password_hash("DoctorPass123!"),
            role="doctor",
            first_name="Sarah",
            last_name="Jones",
            is_active=True
        )
        db.add(doctor2)
        print("Created doctor user: Dr. Sarah Jones (dr_jones / DoctorPass123!)")

    # 3. Create Staff (Receptionist)
    staff1 = db.query(User).filter(User.username == "staff_reception").first()
    if not staff1:
        staff1 = User(
            username="staff_reception",
            email="reception@pabms.com",
            password_hash=get_password_hash("StaffPass123!"),
            role="receptionist",
            first_name="Jane",
            last_name="Doe",
            is_active=True
        )
        db.add(staff1)
        print("Created staff user: Jane Doe (staff_reception / StaffPass123!)")

    # 4. Create Nurses
    nurse1 = db.query(User).filter(User.username == "nurse_mary").first()
    if not nurse1:
        nurse1 = User(
            username="nurse_mary",
            email="mary@pabms.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="Mary",
            last_name="Johnson",
            is_active=True
        )
        db.add(nurse1)
        print("Created nurse: Mary Johnson (nurse_mary / NursePass123!)")

    nurse2 = db.query(User).filter(User.username == "nurse_john").first()
    if not nurse2:
        nurse2 = User(
            username="nurse_john",
            email="john.nurse@pabms.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="John",
            last_name="Williams",
            is_active=True
        )
        db.add(nurse2)
        print("Created nurse: John Williams (nurse_john / NursePass123!)")

    nurse3 = db.query(User).filter(User.username == "nurse_priya").first()
    if not nurse3:
        nurse3 = User(
            username="nurse_priya",
            email="priya@pabms.com",
            password_hash=get_password_hash("NursePass123!"),
            role="nurse",
            first_name="Priya",
            last_name="Nair",
            is_active=True
        )
        db.add(nurse3)
        print("Created nurse: Priya Nair (nurse_priya / NursePass123!)")

    # Create CMO
    cmo1 = db.query(User).filter(User.username == "cmo_john").first()
    if not cmo1:
        cmo1 = User(
            username="cmo_john",
            email="cmo@pabms.com",
            password_hash=get_password_hash("CMOPass123!"),
            role="cmo",
            first_name="Robert",
            last_name="Wilson",
            is_active=True
        )
        db.add(cmo1)
        print("Created CMO user: Robert Wilson (cmo_john / CMOPass123!)")    

    # Save users so they can be referenced
    db.commit()

    # 5. Create Wards, Rooms, and Beds
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
        ward = db.query(Ward).filter(Ward.name == wd["name"]).first()
        if not ward:
            ward = Ward(name=wd["name"], type=wd["type"], capacity=wd["capacity"])
            db.add(ward)
            db.flush()
            
            for rm in wd["rooms"]:
                room = Room(ward_id=ward.id, room_number=rm["room_number"], room_type=rm["room_type"])
                db.add(room)
                db.flush()
                
                for bd_num in rm["beds"]:
                    bed = Bed(room_id=room.id, bed_number=bd_num, status="available")
                    db.add(bed)
            print(f"Created Ward: {wd['name']} with rooms and beds.")
    
    # 6. Create Mock Patients and Admissions if we don't have enough data
    if db.query(Admission).count() < 5:
        print("Seeding mock patients and admissions...")
        db.query(DoctorAssignment).delete()
        db.query(Admission).delete()
        db.query(Patient).delete()
        db.commit()
        
        doc = db.query(User).filter(User.role == "doctor").first()
        doc_id = doc.id if doc else None
        
        def get_bed(room_num, bed_num):
            return db.query(Bed).join(Room).filter(Room.room_number == room_num, Bed.bed_number == bed_num).first()
            
        patients_data = [
            {"first_name": "John", "last_name": "Doe", "dob": date(1985, 4, 10), "gender": "male", "phone": "555-0101", "email": "john.doe@example.com", "address": "123 Maple St", "contact_name": "Mary Doe", "contact_phone": "555-0102", "blood": "O+"},
            {"first_name": "Jane", "last_name": "Miller", "dob": date(1990, 11, 23), "gender": "female", "phone": "555-0201", "email": "jane.miller@example.com", "address": "456 Oak Rd", "contact_name": "James Miller", "contact_phone": "555-0202", "blood": "A-"},
            {"first_name": "Bob", "last_name": "Smith", "dob": date(1978, 8, 5), "gender": "male", "phone": "555-0301", "email": "bob.smith@example.com", "address": "789 Pine Ave", "contact_name": "Alice Smith", "contact_phone": "555-0302", "blood": "AB+"},
            {"first_name": "Emma", "last_name": "Watson", "dob": date(1995, 9, 15), "gender": "female", "phone": "555-0401", "email": "emma.w@example.com", "address": "321 Birch Ln", "contact_name": "Richard Watson", "contact_phone": "555-0402", "blood": "O-"},
            {"first_name": "Michael", "last_name": "Johnson", "dob": date(1965, 12, 1), "gender": "male", "phone": "555-0501", "email": "mike.j@example.com", "address": "654 Elm Dr", "contact_name": "Linda Johnson", "contact_phone": "555-0502", "blood": "B+"},
            {"first_name": "Sarah", "last_name": "Connor", "dob": date(1980, 2, 15), "gender": "female", "phone": "555-0601", "email": "sarah.c@example.com", "address": "987 Cedar Way", "contact_name": "John Connor", "contact_phone": "555-0602", "blood": "A+"}
        ]
        
        patients = []
        for p_data in patients_data:
            patient = Patient(
                first_name=p_data["first_name"],
                last_name=p_data["last_name"],
                date_of_birth=p_data["dob"],
                gender=p_data["gender"],
                phone_number=p_data["phone"],
                email=p_data["email"],
                address=p_data["address"],
                emergency_contact_name=p_data["contact_name"],
                emergency_contact_phone=p_data["contact_phone"],
                blood_group=p_data["blood"],
                is_deleted=False
            )
            db.add(patient)
            db.flush()
            patients.append(patient)
            
        now = datetime.now()
        
        bed_j = get_bed("101", "B1")
        adm1 = Admission(
            patient_id=patients[0].id,
            bed_id=bed_j.id if bed_j else None,
            admission_date=now - timedelta(days=5),
            discharge_date=now - timedelta(days=2),
            reason_for_admission="Fractured arm surgery post-op recovery",
            status="discharged"
        )
        db.add(adm1)
        
        bed_b = get_bed("101", "B2")
        if bed_b:
            bed_b.status = "occupied"
            db.add(bed_b)
        adm2 = Admission(
            patient_id=patients[2].id,
            bed_id=bed_b.id if bed_b else None,
            admission_date=now - timedelta(days=4),
            reason_for_admission="Pneumonia treatment and monitoring",
            status="admitted"
        )
        db.add(adm2)
        db.flush()
        if doc_id:
            db.add(DoctorAssignment(admission_id=adm2.id, doctor_id=doc_id, notes="Primary respiratory doctor"))
            
        bed_jm = get_bed("ICU-1", "B1")
        adm3 = Admission(
            patient_id=patients[1].id,
            bed_id=bed_jm.id if bed_jm else None,
            admission_date=now - timedelta(days=3),
            discharge_date=now - timedelta(days=1),
            reason_for_admission="Acute asthma attack, oxygen therapy",
            status="discharged"
        )
        db.add(adm3)
        
        bed_ew = get_bed("ICU-1", "B2")
        if bed_ew:
            bed_ew.status = "occupied"
            db.add(bed_ew)
        adm4 = Admission(
            patient_id=patients[3].id,
            bed_id=bed_ew.id if bed_ew else None,
            admission_date=now - timedelta(days=2),
            reason_for_admission="Post-cardiac arrest recovery and intensive care",
            status="admitted"
        )
        db.add(adm4)
        db.flush()
        if doc_id:
            db.add(DoctorAssignment(admission_id=adm4.id, doctor_id=doc_id, notes="ICU cardiologist"))
            
        bed_mj = get_bed("P-201", "B1")
        if bed_mj:
            bed_mj.status = "occupied"
            db.add(bed_mj)
        adm5 = Admission(
            patient_id=patients[4].id,
            bed_id=bed_mj.id if bed_mj else None,
            admission_date=now - timedelta(days=1),
            reason_for_admission="Severe dehydration and high fever in pediatric observation",
            status="admitted"
        )
        db.add(adm5)
        db.flush()
        if doc_id:
            db.add(DoctorAssignment(admission_id=adm5.id, doctor_id=doc_id, notes="Pediatrician consultant"))
            
        bed_sc = get_bed("102", "B1")
        adm6 = Admission(
            patient_id=patients[5].id,
            bed_id=bed_sc.id if bed_sc else None,
            admission_date=now - timedelta(days=6),
            discharge_date=now - timedelta(days=4),
            reason_for_admission="Appendix removal surgery post-op observation",
            status="discharged"
        )
        db.add(adm6)

        db.commit()
        print("Mock patients and admissions seeded successfully!")

    db.commit()
    print("Database seeding completed successfully.")

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