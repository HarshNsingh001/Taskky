import asyncio
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def fix_roles():
    async with AsyncSessionLocal() as db:
        # Pura database ko waapas Member bana diya (except harsh singh and original admin)
        await db.execute(
            update(User)
            .where(User.email.notin_(["admin@taskky.com", "harsh@example.com"])) # assuming harsh's email isn't exact, we filter by name
            .where(User.full_name != "harsh singh")
            .values(role=UserRole.MEMBER)
        )
        
        # Make sure "harsh singh" is definitely an Admin
        await db.execute(
            update(User)
            .where(User.full_name == "harsh singh")
            .values(role=UserRole.ADMIN)
        )
        
        await db.commit()
        print("Roles fixed! Harsh is Admin, rest are Members.")

if __name__ == "__main__":
    asyncio.run(fix_roles())
