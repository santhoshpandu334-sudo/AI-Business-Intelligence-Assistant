# Secure AI-Driven Business Intelligence Using RAG and LLMs with Role-Based Access Control

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![LangChain](https://img.shields.io/badge/LangChain-AI-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)

### Enterprise AI-Powered Business Intelligence Platform

Upload business data • Generate AI Insights • Forecast Revenue • Detect Anomalies • Chat with Your Data

</div>

---

# 📖 Overview

**AI Business Intelligence Assistant** is a full-stack enterprise analytics platform that enables organizations to transform raw business data into actionable insights using Artificial Intelligence.

Instead of relying on traditional dashboards alone, the platform combines:

- AI-powered business analysis
- Natural Language Querying (Chat with Data)
- Automated Insight Generation
- Predictive Forecasting
- Interactive Dashboards
- Report Generation
- Data Profiling & Quality Analysis
- Role-Based Enterprise Access

The platform allows business users, analysts, and managers to upload datasets and instantly receive intelligent recommendations, trend analysis, forecasts, anomaly detection, and executive-ready reports.

---

# 🌟 Key Features

## 📊 Business Intelligence Dashboard

- Executive KPI Dashboard
- Revenue Analytics
- Profit Tracking
- Interactive Charts
- Business Performance Metrics
- Dataset Overview
- Data Quality Score
- Real-time Statistics

---

## 📂 Dataset Management

- CSV Upload
- Excel Upload
- JSON Upload
- Automatic Data Cleaning
- Data Validation
- Duplicate Detection
- Missing Value Detection
- Dataset Versioning
- Dataset Preview

---

## 🤖 AI Business Assistant

Ask questions such as:

- What is my best performing product?
- Which region generated the highest revenue?
- Why did revenue decrease last month?
- Predict next month's sales.
- Which customers generate maximum profit?
- Show sales trends.
- Detect unusual transactions.

The assistant uses AI to answer business questions in natural language.

---

## 📈 Predictive Analytics

- Revenue Forecasting
- Sales Prediction
- Trend Analysis
- Time-Series Analytics
- Business Growth Projection
- Future Performance Estimation

---

## 🔍 Smart Insights Engine

Automatically generates:

- Executive Summary
- Business Highlights
- Top Opportunities
- Risk Analysis
- Performance Analysis
- Revenue Drivers
- Profit Analysis
- Actionable Recommendations

---

## 🚨 Anomaly Detection

Automatically identifies:

- Revenue Drops
- Profit Loss
- Outliers
- Unusual Transactions
- Data Inconsistencies
- Suspicious Business Patterns

---

## 📄 Report Generation

Generate professional reports in:

- PDF
- Excel
- CSV

Reports include:

- KPIs
- Charts
- AI Insights
- Forecast Results
- Business Recommendations

---

## 👥 Enterprise User Management

Supports multiple user roles:

- Admin
- Manager
- Analyst

Features include:

- JWT Authentication
- Secure Login
- Role-Based Access Control (RBAC)
- Audit Logs
- User Activity Tracking

---

# 🎯 Why This Project?

Traditional BI tools require users to manually analyze dashboards and create reports.

This platform goes beyond visualization by combining Business Intelligence with Artificial Intelligence.

Instead of only showing charts, the platform explains:

- What happened
- Why it happened
- What may happen next
- Recommended business actions

making analytics faster, smarter, and more accessible.

---

# ✨ Core Modules

- Authentication & Authorization
- Dataset Upload
- Data Profiling
- Data Cleaning
- Dashboard Analytics
- AI Chat Assistant
- Predictive Forecasting
- Business Insights
- Report Generator
- Admin Console
- Audit Logging

---

# 📌 Current Project Status

| Module | Status |
|---------|--------|
| Authentication | ✅ Completed |
| Dashboard | ✅ Completed |
| Dataset Upload | ✅ Completed |
| Data Profiling | ✅ Completed |
| AI Chat | ✅ Completed |
| Forecasting | ✅ Completed |
| Insights Engine | ✅ Completed |
| Reports | ✅ Completed |
| Admin Console | ✅ Completed |
| Enterprise UI | ✅ Completed |

---

# 📑 Table of Contents

- Overview
- Features
- Architecture
- Technology Stack
- Project Structure
- Installation
- Running the Project
- API Documentation
- AI Workflow
- Screenshots
- Roadmap
- Contributors
- License

---# 🏗️ System Architecture

```text
                    ┌─────────────────────────────┐
                    │        End Users            │
                    │─────────────────────────────│
                    │ • Admin                     │
                    │ • Manager                   │
                    │ • Analyst                   │
                    └──────────────┬──────────────┘
                                   │
                          React + TypeScript
                                   │
                    ┌──────────────▼──────────────┐
                    │        Frontend UI          │
                    │─────────────────────────────│
                    │ Dashboard                   │
                    │ Upload Center               │
                    │ AI Chat                     │
                    │ Forecast                    │
                    │ Reports                     │
                    │ Admin Panel                 │
                    └──────────────┬──────────────┘
                                   │ REST APIs
                                   │ JWT Authentication
                    ┌──────────────▼──────────────┐
                    │      FastAPI Backend        │
                    │─────────────────────────────│
                    │ Authentication              │
                    │ Dataset Processing          │
                    │ AI Engine                   │
                    │ Forecast Engine             │
                    │ Reports Engine              │
                    │ Audit Logs                  │
                    └──────────────┬──────────────┘
                                   │
                ┌──────────────────┼─────────────────┐
                │                  │                 │
         PostgreSQL          AI Services        File Storage
                │                  │                 │
         Dataset Tables     LangChain + RAG     CSV / Excel
         User Tables        FAISS Index         Uploaded Files
         Reports            LLM                 Cleaned Files
```

---

# ⚙️ Technology Stack

## 🎨 Frontend

| Technology | Purpose |
|------------|----------|
| React 19 | User Interface |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Router | Navigation |
| Recharts | Interactive Charts |
| Axios | API Communication |

---

## ⚡ Backend

| Technology | Purpose |
|------------|----------|
| FastAPI | REST API |
| SQLAlchemy | ORM |
| Pydantic | Validation |
| JWT | Authentication |
| Passlib | Password Hashing |
| Uvicorn | ASGI Server |

---

## 🗄 Database

| Technology | Purpose |
|------------|----------|
| PostgreSQL | Primary Database |
| SQLite | Development Fallback |

---

## 🤖 Artificial Intelligence

| Technology | Purpose |
|------------|----------|
| LangChain | AI Workflow |
| FAISS | Vector Database |
| Sentence Transformers | Embeddings |
| RAG | Retrieval-Augmented Generation |
| LLM | Business Question Answering |

---

## 📊 Data Processing

- Pandas
- NumPy
- OpenPyXL
- Scikit-Learn
- Matplotlib
- Seaborn

---

## ☁ Deployment

- Docker
- Docker Compose
- GitHub
- GitHub Actions (CI/CD Ready)

---

# 📂 Project Structure

```text
AI-Business-Intelligence-Assistant
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── db
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   ├── core
│   │   ├── utils
│   │   └── main.py
│   │
│   ├── uploads
│   ├── reports
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── context
│   │   ├── services
│   │   ├── hooks
│   │   ├── utils
│   │   ├── types
│   │   └── App.tsx
│   │
│   ├── public
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── .github
```

---

# 🗄️ Database Design

The application stores structured business information using PostgreSQL.

## Main Tables

- Users
- Companies
- Datasets
- Dataset Files
- Dataset Columns
- Dataset Statistics
- Data Records
- Data Quality Reports
- Forecast Models
- AI Insights
- Reports
- Audit Logs
- Notifications
- AI Usage Logs

---

# 🔄 AI Workflow

```text
User Uploads Dataset
          │
          ▼
Data Validation
          │
          ▼
Data Cleaning
          │
          ▼
Data Profiling
          │
          ▼
Statistics Generation
          │
          ▼
Vector Embeddings
          │
          ▼
FAISS Index
          │
          ▼
LangChain RAG Pipeline
          │
          ▼
LLM Processing
          │
          ▼
Business Insights
          │
          ▼
Dashboard + Reports + AI Chat
```

---

# 🔐 Authentication Flow

```text
Login
   │
   ▼
JWT Token Generated
   │
   ▼
Stored Securely
   │
   ▼
Protected API Requests
   │
   ▼
Role Verification
   │
   ▼
Access Granted
```

---

# 📈 Data Processing Pipeline

```
CSV / Excel / JSON
        │
        ▼
File Upload
        │
        ▼
Validation Engine
        │
        ▼
Cleaning Engine
        │
        ▼
Schema Detection
        │
        ▼
Statistics Generation
        │
        ▼
Database Storage
        │
        ▼
AI Analysis
        │
        ▼
Interactive Dashboard
```

---# 🚀 Getting Started

Follow these instructions to set up the project locally.

---

# 📋 Prerequisites

Before running the project, ensure the following software is installed.

| Software | Version |
|-----------|----------|
| Python | 3.12+ |
| Node.js | 20+ |
| npm | Latest |
| PostgreSQL | 16+ |
| Git | Latest |
| Docker (Optional) | Latest |

---

# 📥 Clone Repository

```bash
git clone https://github.com/sumanthnadipineni26/AI-Business-Intelligence-Assistant.git

cd AI-Business-Intelligence-Assistant
```

---

# ⚙ Backend Setup

Navigate to backend.

```bash
cd backend
```

Create Virtual Environment

Windows

```bash
python -m venv venv
```

Activate Virtual Environment

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

# 🗄 Configure Database

Create PostgreSQL database.

Example

```
Database Name

ai_business_intelligence
```

Update your environment variables.

Example

```
DATABASE_URL=postgresql://username:password@localhost:5432/ai_business_intelligence
```

---

# ▶ Start Backend

```bash
uvicorn app.main:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

Swagger Documentation

```
http://127.0.0.1:8000/docs
```

ReDoc Documentation

```
http://127.0.0.1:8000/redoc
```

---

# 🎨 Frontend Setup

Open another terminal.

```bash
cd frontend
```

Install dependencies.

```bash
npm install
```

Start frontend.

```bash
npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# 🔐 Environment Variables

Backend

```
DATABASE_URL=

SECRET_KEY=

ACCESS_TOKEN_EXPIRE_MINUTES=

OPENAI_API_KEY=

SMTP_SERVER=

SMTP_PORT=

SMTP_USERNAME=

SMTP_PASSWORD=
```

Frontend

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

# 🐳 Docker Setup

Run the entire application using Docker.

```bash
docker-compose up --build
```

Run in background.

```bash
docker-compose up -d
```

Stop containers.

```bash
docker-compose down
```

---

# 📡 API Overview

## Authentication

```
POST /api/v1/auth/register

POST /api/v1/auth/login

GET /api/v1/auth/me
```

---

## Dataset Management

```
POST /api/v1/datasets/upload

GET /api/v1/datasets

GET /api/v1/datasets/{id}

DELETE /api/v1/datasets/{id}

PUT /api/v1/datasets/{id}
```

---

## Dashboard

```
GET /api/v1/dashboard/summary

GET /api/v1/dashboard/charts

GET /api/v1/dashboard/kpis
```

---

## AI Chat

```
POST /api/v1/chat/message

GET /api/v1/chat/history

DELETE /api/v1/chat/history
```

---

## Forecasting

```
POST /api/v1/forecast/generate

GET /api/v1/forecast/history
```

---

## Reports

```
POST /api/v1/reports/generate

GET /api/v1/reports

GET /api/v1/reports/download/{id}
```

---

# ✅ Running the Project

Start backend

```bash
cd backend

venv\Scripts\activate

uvicorn app.main:app --reload
```

Start frontend

```bash
cd frontend

npm run dev
```

Open browser

```
http://localhost:5173
```

---

# 📁 Default Workflow

```
Register

↓

Login

↓

Upload Dataset

↓

Data Validation

↓

Data Cleaning

↓

Dashboard Analytics

↓

AI Chat

↓

Forecasting

↓

Generate Reports

↓

Business Decision Making
```

---

# 📊 Supported File Types

✅ CSV

✅ Excel (.xlsx)

✅ Excel (.xls)

✅ JSON

---

# 🔍 Built-in Data Processing

✔ Missing Value Detection

✔ Duplicate Detection

✔ Data Cleaning

✔ Data Validation

✔ Schema Detection

✔ Column Statistics

✔ Dataset Preview

✔ Quality Score Calculation

✔ Automatic Profiling

---
# ✨ Feature Walkthrough

This platform is divided into multiple intelligent modules that work together to provide an end-to-end AI-powered Business Intelligence solution.

---

# 📊 Executive Dashboard

The Executive Dashboard provides a real-time overview of business performance after a dataset is uploaded.

### Features

- 📈 Revenue Analytics
- 💰 Profit Analysis
- 📊 KPI Cards
- 📉 Monthly Trends
- 🌍 Regional Performance
- 🏆 Top Performing Products
- ⚠ Business Alerts
- 📅 Dataset Summary

### Dashboard Metrics

- Total Revenue
- Total Profit
- Total Customers
- Number of Orders
- Growth Rate
- Quality Score
- Total Records
- Total Columns

---

### Dashboard Preview

> 📸 Add Dashboard Screenshot Here

```
/screenshots/dashboard.png
```

---

# 📂 Smart Dataset Upload

The Dataset Upload module allows users to upload business datasets securely while automatically profiling and validating the data.

### Supported Formats

- CSV
- Excel (.xlsx)
- Excel (.xls)
- JSON

### Automatic Processing

✔ File Validation

✔ Schema Detection

✔ Missing Value Detection

✔ Duplicate Detection

✔ Data Cleaning

✔ Column Profiling

✔ Data Quality Analysis

✔ Dataset Statistics

✔ Storage in Database

---

### Upload Workflow

```
Select Dataset

↓

Validate File

↓

Clean Dataset

↓

Generate Statistics

↓

Store Database

↓

Dashboard Ready
```

---

### Upload Screenshot

> 📸 Add Upload Page Screenshot Here

```
/screenshots/upload.png
```

---

# 🤖 AI Business Assistant

The AI Chat module allows business users to communicate with their data using natural language.

Instead of writing SQL queries or manually exploring dashboards, users simply ask questions.

### Example Questions

```
Show top customers.

```

```
Predict next month's revenue.

```

```
Which region performed best?

```

```
What caused the revenue decline?

```

```
Compare profit across categories.

```

```
Summarize this dataset.

```

---

### AI Capabilities

- Natural Language Understanding
- Context-Aware Responses
- Dataset Question Answering
- Executive Summaries
- Business Recommendations
- Interactive Conversations

---

### AI Chat Screenshot

> 📸 Add AI Chat Screenshot Here

```
/screenshots/chat.png
```

---

# 🧠 Retrieval-Augmented Generation (RAG)

The AI assistant uses Retrieval-Augmented Generation (RAG) to improve response accuracy.

Instead of relying only on a language model, the assistant retrieves relevant information from the uploaded datasets before generating an answer.

### RAG Pipeline

```
Dataset Upload

↓

Data Cleaning

↓

Text Extraction

↓

Embedding Generation

↓

Vector Storage (FAISS)

↓

Similarity Search

↓

Relevant Context

↓

Large Language Model

↓

Business Answer
```

### Benefits

- Higher Accuracy
- Context-Aware Answers
- Reduced Hallucinations
- Faster Information Retrieval
- Enterprise Knowledge Search

---

# 📈 Predictive Forecasting

The forecasting engine predicts future business performance based on historical data.

### Features

- Revenue Forecasting
- Sales Forecast
- Trend Prediction
- Future KPI Estimation
- Growth Projection

### Forecast Outputs

- Forecast Charts
- Predicted Revenue
- Confidence Indicators
- Trend Analysis
- Business Recommendations

---

### Forecast Screenshot

> 📸 Add Forecast Screenshot Here

```
/screenshots/forecast.png
```

---

# 💡 AI Insights Engine

The Insights Engine automatically analyzes datasets and generates business intelligence without requiring manual exploration.

### Generated Insights

📈 Revenue Trends

💰 Profit Analysis

📊 Customer Behaviour

🏆 Top Products

🌍 Regional Performance

⚠ Risk Factors

📉 Declining Metrics

🚀 Growth Opportunities

---

### Business Recommendations

Examples include:

- Increase investment in high-performing regions.
- Focus marketing on profitable customer segments.
- Reduce costs in underperforming categories.
- Optimize inventory for seasonal demand.

---

### Insights Screenshot

> 📸 Add Insights Screenshot Here

```
/screenshots/insights.png
```

---

# 🚨 Anomaly Detection

The platform automatically detects unusual patterns in business data.

### Detects

- Revenue Drops
- Profit Loss
- Outliers
- Suspicious Transactions
- Data Errors
- Unexpected Trends

This helps organizations identify potential issues before they become major business problems.

---

# 📄 Report Generation

Generate professional business reports in a single click.

### Export Formats

- PDF
- Excel
- CSV

Reports include:

- Executive Summary
- KPI Overview
- Charts
- Forecast Results
- AI Insights
- Recommendations

---

### Reports Screenshot

> 📸 Add Reports Screenshot Here

```
/screenshots/reports.png
```

---

# 👨‍💼 Admin Console

Administrators can manage the entire platform from a centralized dashboard.

### Features

- User Management
- Dataset Monitoring
- Audit Logs
- Role Management
- Platform Statistics
- Activity Tracking

---

### User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full Access |
| Manager | Business Operations |
| Analyst | Analytics & Reports |

---

### Admin Screenshot

> 📸 Add Admin Dashboard Screenshot Here

```
/screenshots/admin.png
```

---

# 🔒 Security Features

The application follows enterprise-grade security practices.

### Security Highlights

- JWT Authentication
- Password Hashing
- Role-Based Access Control (RBAC)
- Protected API Endpoints
- Audit Logging
- Secure File Upload
- Input Validation
- SQL Injection Protection
- CORS Protection

---

# 📈 Business Intelligence Workflow

```
Upload Dataset
      │
      ▼
Validate Data
      │
      ▼
Clean Dataset
      │
      ▼
Generate Statistics
      │
      ▼
Store in Database
      │
      ▼
AI Processing
      │
      ▼
Dashboard Analytics
      │
      ▼
Business Insights
      │
      ▼
Forecast Future
      │
      ▼
Generate Reports
      │
      ▼
Business Decision Support
```

---

# 🎯 Enterprise Benefits

✔ Faster Decision Making

✔ AI-Powered Business Analysis

✔ Improved Data Quality

✔ Reduced Manual Reporting

✔ Intelligent Forecasting

✔ Secure Enterprise Architecture

✔ Scalable Full-Stack Design

✔ Executive-Level Reporting

✔ Interactive Data Exploration

✔ AI-Assisted Business Intelligence

---# 📸 Project Screenshots

> Replace the placeholders below with your actual screenshots.

## 🏠 Landing Page

![Landing Page](screenshots/landing.png)

---

## 📊 Executive Dashboard

![Dashboard](screenshots/dashboard.png)

---

## 📂 Dataset Upload

![Upload](screenshots/upload.png)

---

## 🤖 AI Business Assistant

![AI Chat](screenshots/chat.png)

---

## 📈 Forecasting

![Forecast](screenshots/forecast.png)

---

## 💡 AI Insights

![Insights](screenshots/insights.png)

---

## 📄 Reports

![Reports](screenshots/reports.png)

---

## 👨‍💼 Admin Console

![Admin](screenshots/admin.png)

---

# 🎥 Demo

A short demonstration video showcasing the platform will be added here.

Example:

```
https://youtu.be/your-demo-video
```

---

# 🛣️ Future Enhancements

The following improvements are planned for future versions:

- AI-powered Dashboard Narration
- Multi-language AI Assistant
- Voice-based Business Queries
- Real-time Streaming Analytics
- Power BI Integration
- Tableau Integration
- Email Report Scheduling
- Advanced ML Forecasting Models
- Automated KPI Alerts
- Mobile Application
- Cloud Deployment (AWS/Azure/GCP)
- Multi-tenant Enterprise Support
- Team Collaboration Features
- Interactive Business Storytelling
- Explainable AI Recommendations

---

# 📊 Project Statistics

| Metric | Value |
|---------|-------|
| Frontend | React 19 + TypeScript |
| Backend | FastAPI |
| Database | PostgreSQL |
| Authentication | JWT |
| AI Framework | LangChain |
| Vector Database | FAISS |
| Supported File Formats | CSV, Excel, JSON |
| User Roles | 3 |
| Modules | 10+ |
| REST APIs | 30+ |
| Enterprise Ready | ✅ |

---

# 🎯 Learning Outcomes

This project demonstrates practical experience in:

- Full Stack Development
- REST API Development
- Enterprise Software Architecture
- Artificial Intelligence Integration
- Retrieval-Augmented Generation (RAG)
- Business Intelligence Systems
- Data Engineering
- Authentication & Authorization
- Database Design
- Data Visualization
- Machine Learning Integration
- Software Engineering Best Practices

---

# 🤝 Contributing

Contributions are welcome.

If you would like to improve this project:

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/new-feature
```

3. Commit your changes.

```bash
git commit -m "Added new feature"
```

4. Push your branch.

```bash
git push origin feature/new-feature
```

5. Open a Pull Request.

---

# 📝 License

This project is licensed under the MIT License.

See the LICENSE file for more information.

---

# 👨‍💻 Author

## Sumanth Nadipineni

Computer Science Engineering Student

AI • Full Stack Development • Business Intelligence • Machine Learning

GitHub:

```
https://github.com/sumanthnadipineni26
```

LinkedIn:

```
(Add your LinkedIn profile here)
```

Email:

```
(Add your professional email here)
```

---

# 🙏 Acknowledgements

Special thanks to the open-source community and the following technologies:

- FastAPI
- React
- TypeScript
- PostgreSQL
- LangChain
- FAISS
- Pandas
- NumPy
- Tailwind CSS
- Docker

for making modern AI application development accessible.

---

# ⭐ Support

If you found this project useful:

⭐ Star this repository

🍴 Fork the project

🛠️ Contribute improvements

📢 Share it with others

---

<div align="center">

# 🚀 AI Business Intelligence Assistant

### Transforming Business Data into Intelligent Decisions

**Built with ❤️ using FastAPI, React, TypeScript, PostgreSQL, and Artificial Intelligence**

⭐ **If you like this project, don't forget to star the repository!** ⭐

</div>
