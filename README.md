# AutoMax: Car Dealership Inventory System

AutoMax is a full-stack Car Dealership Inventory Management System featuring a **FastAPI** backend, **SQLite** database (SQLAlchemy ORM), **JWT Authentication**, and a **React** frontend built with **Tailwind CSS v4**.

Development strictly followed **Test-Driven Development (TDD)** principles.

---

## Features

- **Auth**: User registration, login, and JWT verification.
- **CRUD Operations**: Search, add, update, delete, and restock vehicles.
- **Transactions**: Buy cars (decreases stock quantity).
- **Admin Roles**: Restricted privileges for adding, updating, deleting, and restocking.

---

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows: .venv\Scripts\Activate.ps1
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```
* Runs at http://localhost:8000
* Docs at http://localhost:8000/docs
* Run tests with: `pytest`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
* Runs at http://localhost:5173/

---

## My AI Usage

### AI Tools Used
- **Gemini (via Antigravity IDE)**: Code suggestions, TDD pytest creation, boilerplates, and Tailwind configuration.

### How I Used AI
- **TDD Workflow**: Wrote tests first (`tests/test_auth.py` and `tests/test_cars.py`) before building endpoints.
- **CRUD Boilerplates**: Assisted in writing schemas, models, and CRUD controllers.
- **Bug Fixes**: Configured `@tailwindcss/vite` for Tailwind v4 and resolved React state caching.

### Reflection
- **Saved Time**: Automated standard endpoint setup and initial test templates.
- **Improved Code**: Kept the architecture clean and aligned with SOLID design principles.
- **Human Guidance**: Resolved compatibility issues (downgraded `bcrypt` for Python 3.12 support), established admin claims logic, and guided TDD workflow.
