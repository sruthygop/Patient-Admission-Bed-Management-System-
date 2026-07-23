import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db, engine
from app.core.security import create_access_token, get_password_hash
from app.models.models import User, Patient, AuditLog

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Begin a transaction that we will roll back
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Ensure our test users exist in the transaction
    # We clear them out or check if they are already in the DB
    admin = session.query(User).filter(User.username == "test_admin").first()
    if not admin:
        admin = User(
            username="test_admin",
            email="admin@test.com",
            password_hash=get_password_hash("password"),
            role="admin",
            first_name="Admin",
            last_name="User",
            is_active=True
        )
        session.add(admin)
        
    staff = session.query(User).filter(User.username == "test_staff").first()
    if not staff:
        staff = User(
            username="test_staff",
            email="staff@test.com",
            password_hash=get_password_hash("password"),
            role="staff",
            first_name="Staff",
            last_name="User",
            is_active=True
        )
        session.add(staff)
        
    doctor = session.query(User).filter(User.username == "test_doctor").first()
    if not doctor:
        doctor = User(
            username="test_doctor",
            email="doc@test.com",
            password_hash=get_password_hash("password"),
            role="doctor",
            first_name="Doc",
            last_name="User",
            is_active=True
        )
        session.add(doctor)
        
    session.commit()
    
    yield session
    
    # Roll back all changes made during the test
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def get_auth_headers(username: str) -> dict:
    token = create_access_token(subject=username)
    return {"Authorization": f"Bearer {token}"}

# --- TESTS ---

def test_create_patient_authorized(client):
    headers = get_auth_headers("test_staff")
    patient_data = {
        "first_name": "Alice",
        "last_name": "Smith",
        "date_of_birth": "1990-05-15",
        "gender": "female",
        "phone_number": "1234567890",
        "email": "alice@example.com",
        "address": "123 Main St",
        "emergency_contact_name": "Bob Smith",
        "emergency_contact_phone": "0987654321",
        "blood_group": "O+"
    }
    
    response = client.post("/api/v1/patients/", json=patient_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Alice"
    assert data["is_deleted"] is False
    assert "id" in data

def test_create_patient_unauthorized_role(client):
    # Doctor is not authorized to register patients
    headers = get_auth_headers("test_doctor")
    patient_data = {
        "first_name": "Alice",
        "last_name": "Smith",
        "date_of_birth": "1990-05-15",
        "gender": "female",
        "phone_number": "1234567890",
        "address": "123 Main St",
        "emergency_contact_name": "Bob Smith",
        "emergency_contact_phone": "0987654321"
    }
    
    response = client.post("/api/v1/patients/", json=patient_data, headers=headers)
    assert response.status_code == 403

def test_create_patient_invalid_gender(client):
    headers = get_auth_headers("test_staff")
    patient_data = {
        "first_name": "Alice",
        "last_name": "Smith",
        "date_of_birth": "1990-05-15",
        "gender": "invalid_gender",
        "phone_number": "1234567890",
        "address": "123 Main St",
        "emergency_contact_name": "Bob Smith",
        "emergency_contact_phone": "0987654321"
    }
    
    response = client.post("/api/v1/patients/", json=patient_data, headers=headers)
    assert response.status_code == 422

def test_get_patients_and_search(client, db_session):
    # Seed a patient directly in the session
    p1 = Patient(
        first_name="Charles",
        last_name="Darwin",
        date_of_birth="1809-02-12",
        gender="male",
        phone_number="5551234",
        address="Down House",
        emergency_contact_name="Emma Darwin",
        emergency_contact_phone="5554321",
        is_deleted=False
    )
    p2 = Patient(
        first_name="Marie",
        last_name="Curie",
        date_of_birth="1867-11-07",
        gender="female",
        phone_number="5559876",
        address="Paris",
        emergency_contact_name="Pierre Curie",
        emergency_contact_phone="5554321",
        is_deleted=False
    )
    db_session.add_all([p1, p2])
    db_session.commit()
    
    headers = get_auth_headers("test_doctor")
    
    # Get all
    response = client.get("/api/v1/patients/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    
    # Search by name
    response = client.get("/api/v1/patients/?search=curie", headers=headers)
    assert response.status_code == 200
    search_data = response.json()
    assert len(search_data) == 1
    assert search_data[0]["first_name"] == "Marie"

def test_update_patient(client, db_session):
    p = Patient(
        first_name="Isaac",
        last_name="Newton",
        date_of_birth="1643-01-04",
        gender="male",
        phone_number="99988877",
        address="Woolsthorpe",
        emergency_contact_name="Hannah Ayscough",
        emergency_contact_phone="11122233",
        is_deleted=False
    )
    db_session.add(p)
    db_session.commit()
    
    headers = get_auth_headers("test_staff")
    update_data = {
        "first_name": "Sir Isaac",
        "phone_number": "00000000"
    }
    
    response = client.put(f"/api/v1/patients/{p.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Sir Isaac"
    assert data["phone_number"] == "00000000"
    
    # Check audit log was written in this transaction
    audit_log = db_session.query(AuditLog).filter(AuditLog.entity_id == p.id).first()
    assert audit_log is not None
    assert audit_log.action == "PATIENT_UPDATED"
    assert audit_log.new_values["first_name"] == "Sir Isaac"

def test_delete_patient_rbac(client, db_session):
    p = Patient(
        first_name="Albert",
        last_name="Einstein",
        date_of_birth="1879-03-14",
        gender="male",
        phone_number="7776665",
        address="Princeton",
        emergency_contact_name="Elsa Einstein",
        emergency_contact_phone="11122233",
        is_deleted=False
    )
    db_session.add(p)
    db_session.commit()
    
    # Staff tries to delete -> forbidden
    staff_headers = get_auth_headers("test_staff")
    response = client.delete(f"/api/v1/patients/{p.id}", headers=staff_headers)
    assert response.status_code == 403
    
    # Admin tries to delete -> success
    admin_headers = get_auth_headers("test_admin")
    response = client.delete(f"/api/v1/patients/{p.id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Patient successfully deleted (soft delete)"
    
    # Check it is soft-deleted
    assert p.is_deleted is True
