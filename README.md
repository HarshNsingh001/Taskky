# 🚀 Taskky - Enterprise Task Management & SaaS Platform

Taskky is a high-performance, multi-tenant SaaS task management platform designed for modern teams. Built with a focus on **User Experience (UX)**, **Premium Design**, and **Strict Role-Based Workflows**, Taskky offers a seamless and structured approach to project planning and real-time collaboration.

![Taskky Banner](https://images.unsplash.com/photo-1540350394557-8d14678e7f91?q=80&w=2000&auto=format&fit=crop)

## ✨ Core Features

- **🏢 Multi-Tenant Architecture**: Built-in organization isolation. Organizations can easily onboard teams using secure invite codes.
- **🛡️ Strict Role-Based Access Control (RBAC)**: 
  - **Admins**: Full organizational oversight, project creation, team management, and final task approval authority.
  - **Members**: Isolated personalized dashboards, restricted project visibility, and constrained workflow actions.
- **🔄 Intelligent Task Workflow**: Enforces a rigid pipeline (`To Do ➔ In Progress ➔ Review ➔ Done`). Members can only submit tasks for review, while Admins hold the power to Approve or Reject.
- **🔁 Task Revision Tracking**: Features an automatic "bounce counter" that tracks and displays how many times a task was rejected by an admin, providing visual metrics on rework and task difficulty.
- **⚡ Targeted Real-Time Notifications**: Highly optimized WebSocket architecture that routes specific events to targeted roles (e.g., Admins are instantly notified when a task enters Review; Members are pinged upon task approval/rejection).
- **📊 Personalized Analytics**: Dedicated dashboard views scoped automatically by role—Org-wide analytics for Admins, and personal performance tracking for Members.
- **💎 Premium Glassmorphic UI**: A stunning, high-end interface built with Tailwind CSS, Framer Motion, and a carefully curated aesthetic.

## 🛠 Tech Stack

### Frontend
- **React (Vite) & TypeScript**
- **Tailwind CSS** (Custom Design System & Glassmorphism)
- **Framer Motion** (Premium Micro-animations)
- **Lucide React** (Modern Iconography)
- **Radix UI / Shadcn** (Accessible Components)

### Backend
- **FastAPI** (High-performance Python framework)
- **SQLAlchemy 2.0** (Async ORM)
- **PostgreSQL** (Relational Database)
- **Pydantic V2** (Strict Data Validation)
- **WebSockets** (Connection Manager for Live Updates)
- **Alembic** (Automated Database Migrations)

## 📁 Project Structure

```bash
Taskky/
├── backend/                # FastAPI Application
│   ├── alembic/            # Database Migrations
│   ├── app/                # Core Logic
│   │   ├── api/            # REST API & WebSocket Routes
│   │   ├── core/           # Config & Auth Dependencies
│   │   ├── models/         # SQLAlchemy Models
│   │   └── services/       # Business Logic & RBAC Enforcement
│   └── Procfile            # Deployment Config
├── frontend/               # React (Vite) Application
│   ├── src/
│   │   ├── components/     # UI Components (Dashboards, Modals)
│   │   ├── context/        # Global State (WebSockets, Auth)
│   │   ├── pages/          # Board, Team, Analytics Views
│   │   └── theme/          # CSS Variables & Design Tokens
│   └── tailwind.config.js  # Custom UI Configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
3. Set up environment variables in a `.env` file:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost/taskky
   SECRET_KEY=your_secret_key
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

Taskky is optimized for deployment on **Railway.app**.

1. Connect your GitHub repository to Railway.
2. Add a **PostgreSQL** database service.
3. Deploy the `backend` directory (ensure `DATABASE_URL` and `SECRET_KEY` are set).
4. Deploy the `frontend` directory (ensure `VITE_API_URL` is set to your backend URL).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by HARSH NARAYAN SINGH
