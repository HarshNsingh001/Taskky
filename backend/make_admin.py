import asyncio
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def make_admin():
    async with AsyncSessionLocal() as db:
        await db.execute(update(User).values(role=UserRole.ADMIN))
        await db.commit()
        print("All users are now Admins!")

if __name__ == "__main__":
    asyncio.run(make_admin())
