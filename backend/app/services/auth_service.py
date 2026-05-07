from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserResponse
from app.repositories.user_repository import UserRepository
from app.repositories.organization_repository import OrganizationRepository
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
        self.org_repo = OrganizationRepository(db)

    async def signup(self, data: SignupRequest) -> dict:
        # Check if email already exists
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictException("A user with this email already exists")

        role = UserRole.ADMIN if data.role == "admin" else UserRole.MEMBER

        if role == UserRole.ADMIN:
            # Admin signup: Create a new Organization
            org_name = f"{data.full_name}'s Workspace"
            org = Organization(name=org_name)
            org = await self.org_repo.create(org)

            user = User(
                full_name=data.full_name,
                email=data.email,
                password_hash=hash_password(data.password),
                role=role,
                organization_id=org.id,
            )
            user = await self.user_repo.create(user)

        else:
            # Member signup: Validate invite code and join existing Organization
            if not data.invite_code or not data.invite_code.strip():
                raise UnauthorizedException("Team invite code is required to join as a member")

            org = await self.org_repo.get_by_invite_code(data.invite_code)
            if not org:
                raise UnauthorizedException("Invalid Team Invite Code. Please check with your team admin.")

            user = User(
                full_name=data.full_name,
                email=data.email,
                password_hash=hash_password(data.password),
                role=role,
                organization_id=org.id,
            )
            user = await self.user_repo.create(user)

        tokens = self._generate_tokens(user)
        user_response = UserResponse.model_validate(user)
        return {
            "user": user_response,
            "tokens": tokens,
            "organization": {
                "id": str(org.id),
                "name": org.name,
                "invite_code": org.invite_code,
            },
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
        token_data = {"sub": str(user.id), "role": user.role.value, "org": str(user.organization_id)}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )
