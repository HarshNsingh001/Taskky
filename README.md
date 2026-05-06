# 🚀 Taskky - Modern Team Task Management & SaaS Platform

Taskky is a high-performance, production-grade task management platform designed for modern teams. Built with a focus on **User Experience (UX)**, **Premium Design**, and **Scalability**, Taskky offers a seamless workflow from project planning to real-time collaboration.

![Taskky Banner](https://images.unsplash.com/photo-1540350394557-8d14678e7f91?q=80&w=2000&auto=format&fit=crop)

## ✨ Features

- **💎 Premium Glassmorphic UI**: A stunning, high-end interface built with Tailwind CSS and Framer Motion.
- **⚡ Real-time Collaboration**: WebSocket integration for instant notifications and task updates.
- **📊 Advanced Analytics**: Detailed productivity trends and project tracking for administrative users.
- **🔐 Secure RBAC**: Robust Role-Based Access Control system for Admins and Team Members.
- **💳 Subscription Management**: Full SaaS billing flow with pricing tiers and mock invoice generation.
- **🌓 Dark/Light Mode**: Seamless theme switching with a curated color palette.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile devices.

## 🛠 Tech Stack

### Frontend
- **React (Vite)**
- **Tailwind CSS** (Custom Design System)
- **Framer Motion** (Premium Animations)
- **Lucide React** (Iconography)
- **Shadcn UI** (Components)
- **Sonner** (Toast Notifications)

### Backend
- **FastAPI** (Python)
- **SQLAlchemy 2.0** (ORM)
- **PostgreSQL** (Database)
- **Pydantic V2** (Data Validation)
- **WebSockets** (Real-time)
- **Alembic** (Database Migrations)

## 📁 Project Structure

```bash
Taskky/
├── backend/                # FastAPI Application
│   ├── app/                # Core Logic
│   │   ├── api/            # API Routes
│   │   ├── core/           # Config & DB
│   │   ├── models/         # SQLAlchemy Models
│   │   └── services/       # Business Logic
│   └── Procfile            # Deployment Config
├── frontend/               # React (Vite) Application
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── context/        # State Management
│   │   ├── pages/          # Page Views
│   │   └── theme/          # Design Tokens
│   └── tailwind.config.js  # Design System Config
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
Built with ❤️ by [Your Name/Team]
