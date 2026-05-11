# HEXASHIELD: AI-Assisted Penetration Testing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232a?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

**HexaShield** is a professional, research-grade cybersecurity platform designed for advanced threat analysis and ethical penetration testing. Developed as a graduation project, it integrates AI-driven vulnerability intelligence with modern web architecture to provide a comprehensive security operations center (SOC) experience.

## 🚀 Key Features
- **AI-Driven Analysis**: Automated vulnerability explanations and remediation advice using LLM-inspired logic.
- **Full-Stack Persistence**: Real-time data tracking via FastAPI and SQLite.
- **Dynamic Threat Mapping**: Interactive attack path visualization based on live scan findings.
- **Role-Based Access**: Secure JWT-based authentication for Administrators, Analysts, and Students.
- **Professional Reporting**: On-demand HTML/JSON report generation following industry standards.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), TailwindCSS, Chart.js, Lucide-React.
- **Backend**: FastAPI (Python), SQLAlchemy, JWT, Bcrypt.
- **Methodologies**: OWASP Top 10, NIST CSF, MITRE ATT&CK.

## 📦 Quick Start
Ensure you have Docker installed, then run:
```bash
docker-compose up --build
```
Access the platform at `http://localhost:5174`.  
Default Admin Credentials: `admin` / `admin123`.

## 📂 Project Structure
- `/backend`: FastAPI service layer and security engines.
- `/frontend`: React dashboard and visualization components.
- `/docs`: Installation, API Reference, and Presentation Guides.
- `docker-compose.yml`: Full system orchestration.

## 📄 Documentation
- [Installation Guide](docs/installation.md)
- [API Documentation](docs/api_documentation.md)
- [Project Walkthrough](brain/fdb9a8c8-e37e-4fca-a58f-ebb3929dabad/walkthrough.md)

---
*Created as a University Graduation Project in Cybersecurity.*
