import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus, ProjectPriority
from app.models.project_member import ProjectMember
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.activity_log import ActivityLog, ActivityAction
from app.core.security import hash_password

async def seed_data():
    print("Connecting to database...")
    async with AsyncSessionLocal() as db:
        print("Starting data generation...")
        
        # 1. Ensure Admin exists
        admin_q = await db.execute(select(User).where(User.email == "admin@taskky.com"))
        admin = admin_q.scalar_one_or_none()
        if not admin:
            admin = User(
                full_name="Admin User",
                email="admin@taskky.com",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN
            )
            db.add(admin)
            await db.flush()
        
        # 2. Create More Users
        users = [admin]
        team_members = [
            ("Sarah Jenkins", "sarah@taskky.com", UserRole.MEMBER),
            ("Mike Ross", "mike@taskky.com", UserRole.MEMBER),
            ("Elena Gilbert", "elena@taskky.com", UserRole.MEMBER),
            ("Harvey Specter", "harvey@taskky.com", UserRole.MEMBER),
            ("Rachel Zane", "rachel@taskky.com", UserRole.MEMBER),
        ]
        
        for name, email, role in team_members:
            user_q = await db.execute(select(User).where(User.email == email))
            user = user_q.scalar_one_or_none()
            if not user:
                user = User(
                    full_name=name,
                    email=email,
                    password_hash=hash_password("User@123"),
                    role=role
                )
                db.add(user)
                await db.flush()
            users.append(user)
        
        print(f"Verified/Created {len(users)} users.")

        # 3. Create Projects
        projects_data = [
            ("Website Redesign Q3", "Complete overhaul of the main marketing website with new branding guidelines.", ProjectStatus.ACTIVE, ProjectPriority.HIGH),
            ("Mobile App v2.0", "Developing the next generation mobile application in React Native.", ProjectStatus.ACTIVE, ProjectPriority.HIGH),
            ("API Rate Limiting", "Implementing strict rate limits across all public API endpoints.", ProjectStatus.COMPLETED, ProjectPriority.MEDIUM),
            ("Customer Portal MVP", "Building the minimum viable product for the new self-serve customer portal.", ProjectStatus.ON_HOLD, ProjectPriority.LOW),
        ]
        
        projects = []
        for title, desc, status, priority in projects_data:
            project_q = await db.execute(select(Project).where(Project.title == title))
            project = project_q.scalar_one_or_none()
            if not project:
                project = Project(
                    title=title,
                    description=desc,
                    status=status,
                    priority=priority,
                    owner_id=admin.id
                )
                db.add(project)
                await db.flush()
            projects.append(project)

        print(f"Verified/Created {len(projects)} projects.")

        # 4. Add Project Members
        for project in projects:
            # Add 2 to 4 random members to each project
            num_members = random.randint(2, len(users))
            selected_users = random.sample(users, num_members)
            
            # Always ensure admin is a member (if not owner, but admin is owner here)
            for user in selected_users:
                if user.id == project.owner_id:
                    continue # Owner implicitly has access
                
                member_q = await db.execute(select(ProjectMember).where(
                    ProjectMember.project_id == project.id, 
                    ProjectMember.user_id == user.id
                ))
                if not member_q.scalar_one_or_none():
                    member = ProjectMember(project_id=project.id, user_id=user.id)
                    db.add(member)

        await db.flush()
        print("Assigned project members.")

        # 5. Create Tasks
        tasks_data = [
            # Website Redesign Tasks
            ("Design new hero section", "Create 3 variations for the new landing page hero section.", TaskStatus.DONE, TaskPriority.HIGH, 0, 7),
            ("Implement dark mode", "Add system-aware dark mode using Tailwind CSS.", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 0, 2),
            ("Update typography", "Switch to Inter font family across all pages.", TaskStatus.REVIEW, TaskPriority.LOW, 0, 1),
            ("Optimize image assets", "Convert all PNGs to WebP formats.", TaskStatus.TODO, TaskPriority.LOW, 0, -2),
            ("Fix navigation bug on mobile", "Hamburger menu doesn't close on click.", TaskStatus.TODO, TaskPriority.URGENT, 0, -1),
            
            # Mobile App Tasks
            ("Setup React Native boilerplate", "Initialize project with Expo and basic routing.", TaskStatus.DONE, TaskPriority.HIGH, 1, 10),
            ("Implement auth flow", "Login, signup, and forgot password screens.", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 1, 3),
            ("Push notifications integration", "Setup Firebase Cloud Messaging.", TaskStatus.TODO, TaskPriority.MEDIUM, 1, -5),
            
            # API Tasks
            ("Implement Redis rate limiter", "Use Redis to track IP requests.", TaskStatus.DONE, TaskPriority.HIGH, 2, 5),
            ("Add rate limit headers", "Return X-RateLimit-Remaining in responses.", TaskStatus.DONE, TaskPriority.MEDIUM, 2, 4),
            
            # Portal MVP Tasks
            ("Database schema design", "Draft the ERD for the portal.", TaskStatus.DONE, TaskPriority.HIGH, 3, 14),
            ("Setup Stripe integration", "Implement payment elements.", TaskStatus.TODO, TaskPriority.MEDIUM, 3, -10),
        ]
        
        now = datetime.now(timezone.utc)
        
        # Check if tasks already exist to avoid duplication
        existing_tasks = await db.execute(select(Task))
        if len(existing_tasks.scalars().all()) < 5:
            for title, desc, status, priority, proj_idx, due_offset in tasks_data:
                project = projects[proj_idx]
                
                # Fetch members of this project to assign randomly
                members_q = await db.execute(select(ProjectMember).where(ProjectMember.project_id == project.id))
                project_member_ids = [m.user_id for m in members_q.scalars().all()]
                project_member_ids.append(project.owner_id) # Include owner
                
                assignee_id = random.choice(project_member_ids)
                
                due_date = now - timedelta(days=due_offset) if due_offset > 0 else now + timedelta(days=abs(due_offset))
                created_date = now - timedelta(days=random.randint(2, 10))
                completed_date = now - timedelta(days=random.randint(0, 2)) if status == TaskStatus.DONE else None
                
                task = Task(
                    title=title,
                    description=desc,
                    status=status,
                    priority=priority,
                    due_date=due_date,
                    project_id=project.id,
                    assigned_to=assignee_id,
                    created_by=admin.id,
                    created_at=created_date,
                    completed_at=completed_date
                )
                db.add(task)
            
            await db.flush()
            print("Generated realistic tasks with mixed statuses and dates.")
        
        await db.commit()
        print("✅ Database successfully seeded with sample data!")

if __name__ == "__main__":
    asyncio.run(seed_data())
