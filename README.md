# SafeReturn Handoff Guide

This repository contains three runnable parts:

- `safereturn/` - Expo React Native mobile app
- `safereturn_backend/` - Spring Boot backend API
- `safereturnfaceservice/` - Python FastAPI face-recognition service

The app uses MySQL as its main database.

## 1) What each project does

### `safereturn/`
- Mobile frontend built with Expo.
- Public users register and log in here.
- Police officers also log in here, but only with assigned police credentials.
- The frontend talks to the backend through `EXPO_PUBLIC_API_BASE_URL`.

### `safereturn_backend/`
- Main API for authentication, reports, dashboards, AI chat, OTP, image upload, and police features.
- Uses Spring Boot, Spring Security, JPA, and MySQL.
- Also calls the Python face service when face matching is needed.

### `safereturnfaceservice/`
- Separate Python microservice for face encoding and face verification.
- The backend forwards face-match requests to this service.

## 2) Required software

Install these before running the project:

- Node.js LTS
- npm
- Java 17
- MySQL 8 or compatible
- Python 3.10 or 3.11
- Expo Go on a real phone, or an Android/iOS emulator

If Python package installation fails on Windows, you may also need:

- Microsoft C++ Build Tools
- CMake

## 3) Project startup order

Start the services in this order:

1. MySQL
2. Python face service
3. Spring Boot backend
4. Expo frontend

Reason:
- The backend needs the database.
- The backend also needs the Python face service for face matching.
- The frontend needs the backend API URL.

## 4) Frontend setup

### Folder
- `safereturn/`

### Install
```bash
cd safereturn
npm install
```

### Run
```bash
npm start
```

You can also use:
```bash
npm run android
npm run ios
npm run web
```

### Frontend environment file
File:
- `safereturn/.env`

Required key:
```env
EXPO_PUBLIC_API_BASE_URL=http://<backend-ip>:8080
```

Important notes:
- If testing on a physical phone, `localhost` will not work for the backend.
- Use the computer's LAN IP address instead.
- If the backend runs on the same machine and you are using an Android emulator, `10.0.2.2` may be needed.
- After changing `.env`, restart Expo.
- If the app still uses old values, run:
```bash
npx expo start -c
```

## 5) Backend setup

### Folder
- `safereturn_backend/`

### Run
```bash
cd safereturn_backend
.\mvnw.cmd spring-boot:run
```

### Build check
```bash
.\mvnw.cmd -q -DskipTests compile
```

### Backend config file
File:
- `safereturn_backend/src/main/resources/application.properties`

This file controls:
- MySQL connection
- JWT secret
- Twilio SMS OTP
- Groq AI chat
- Face service URL
- Police seed data

### Important backend settings

#### MySQL
Update the database URL, username, and password so the backend can connect to MySQL.

#### JWT
- `jwt.secret` must be at least 32 characters.
- Keep it private.

#### Twilio
Used for OTP/SMS flows.

If Twilio is not configured correctly:
- OTP features may fail
- registration verification may fail

#### Groq AI
Used by the AI chat features.

If the Groq key is invalid:
- AI chat may fail

#### Face service
The backend uses:
```properties
face.api.url=http://localhost:8000
```

If the Python service runs elsewhere, change this to the correct host.

## 6) Python face service setup

### Folder
- `safereturnfaceservice/`

### Run
```bash
cd safereturnfaceservice
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn face_recognition numpy pillow python-multipart
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Files
- `safereturnfaceservice/main.py`
- `safereturnfaceservice/requirements.txt`

### Important note
The current `requirements.txt` is empty, so the next developer should either:

- install the dependencies manually, or
- fill `requirements.txt` with the Python packages listed above

Recommended `requirements.txt` contents:
```txt
fastapi
uvicorn
face_recognition
numpy
pillow
python-multipart
```

## 7) Police account provisioning

This app supports both:

- public user accounts
- police officer accounts

Public users should register from the mobile app.
Police accounts should be provisioned separately in the backend.

### Police seed flow
The backend includes a seed runner that can create police accounts on startup.

Relevant files:
- `safereturn_backend/src/main/java/com/safereturn/in/bootstrap/PoliceSeedProperties.java`
- `safereturn_backend/src/main/java/com/safereturn/in/bootstrap/PoliceUserSeeder.java`

### How to use police seeding
In `application.properties`:

```properties
safereturn.seed.enabled=true
safereturn.seed.police[0].full-name=Police Officer
safereturn.seed.police[0].phone=9999999999
safereturn.seed.police[0].email=police@example.com
safereturn.seed.police[0].password=ChangeMe123!
```

Then:
1. Start the backend once
2. Let it create the police account in MySQL
3. Log in to the mobile app using the seeded police email and password

### How the seeder behaves
- It runs on backend startup.
- It creates users with `role = POLICE`.
- It skips duplicates by email or phone.
- It hashes passwords before saving.

### Recommended production practice
- Keep the seed flag off unless you are actively provisioning accounts.
- Do not store real police passwords in source control.
- Prefer local/private config or environment overrides for real credentials.

## 8) Suggested launch checklist for a fresh machine

1. Install MySQL and create or let the app create the database.
2. Update `application.properties` with correct DB, JWT, Twilio, Groq, face service, and police seed values.
3. Update `safereturn/.env` with the correct backend API URL.
4. Create and activate the Python virtual environment.
5. Install Python dependencies.
6. Start the Python face service on port `8000`.
7. Start the Spring Boot backend on port `8080`.
8. Start Expo from `safereturn/`.
9. Test login flows for:
   - public user
   - seeded police user

## 9) Common issues and likely fixes

### Frontend cannot reach backend
- Check `EXPO_PUBLIC_API_BASE_URL`
- Use the backend machine's LAN IP for a real phone
- Restart Expo after config changes

### Backend starts but face match fails
- Confirm the Python service is running on port `8000`
- Check `face.api.url`

### OTP does not work
- Check Twilio credentials
- If you only want local testing, use `twilio.mock=true` if your service supports it

### AI chat fails
- Check the Groq API key and backend connectivity

### Police login fails
- Confirm the seed config is enabled
- Confirm the seeded user exists in MySQL
- Confirm the user role is `POLICE`

### Python face service fails to install
- Use Python 3.10 or 3.11
- Install C++ Build Tools and CMake on Windows if needed

## 10) Security reminders

- Do not commit real secrets.
- Do not share real Twilio, Groq, JWT, or database passwords publicly.
- Keep production secrets outside the repo whenever possible.
- Use different credentials for development and production.

## 11) Quick run commands

Frontend:
```bash
cd safereturn
npm install
npm start
```

Backend:
```bash
cd safereturn_backend
.\mvnw.cmd spring-boot:run
```

Python service:
```bash
cd safereturnfaceservice
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn face_recognition numpy pillow python-multipart
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 12) Notes for the next developer

- The app was originally built for public users first.
- Police support was added later.
- Keep the police flow separate from public registration.
- Keep backend, frontend, and Python service running together during testing.
- If a screen breaks, verify the backend is still returning data before changing UI code.
