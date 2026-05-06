from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserResponse
from app.repositories.user_repository import UserRepository
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.utils.exceptions import (
    ConflictException,
    UnauthorizedException,
    NotFoundException,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def signup(self, data: SignupRequest) -> dict:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictException("A user with this email already exists")

        role = UserRole.ADMIN if data.role == "admin" else UserRole.MEMBER
        
        if role == UserRole.MEMBER:
            if data.invite_code != "TASKKY-TEAM":
                raise UnauthorizedException("Invalid Team Invite Code")

        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=role,
        )
        user = await self.user_repo.create(user)

        tokens = self._generate_tokens(user)
        return {
            "user": UserResponse.model_validate(user),
            "tokens": tokens,
        }

    async def login(self, data: LoginRequest) -> dict:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account has been deactivated")

        tokens = self._generate_tokens(user)
        return {
            "user": UserResponse.model_validate(user),
            "tokens": tokens,
        }

    async def refresh(self, data: RefreshRequest) -> TokenResponse:
        payload = decode_refresh_token(data.refresh_token)
        if not payload:
            raise UnauthorizedException("Invalid or expired refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")

        if not user.is_active:
            raise UnauthorizedException("Account has been deactivated")

        return self._generate_tokens(user)

    async def get_current_user(self, user_id: str) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        return UserResponse.model_validate(user)

    def _generate_tokens(self, user: User) -> TokenResponse:
        token_data = {"sub": str(user.id), "role": user.role.value}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )
