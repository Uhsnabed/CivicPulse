from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.services.supabase import get_supabase_client

bearer_scheme = HTTPBearer(auto_error=False)


def require_reviewer(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """
    Verify a Supabase access token and authorize the reviewer.
    Returns the authenticated reviewer's UUID.
    """

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings = get_settings()

    allowed_reviewers = {
        user_id.strip()
        for user_id in settings.reviewer_user_ids.split(",")
        if user_id.strip()
    }

    if not allowed_reviewers:
        raise HTTPException(
            status_code=503,
            detail="Reviewer authorization is not configured.",
        )

    try:
        # Ask Supabase Auth to validate the access token.
        response = get_supabase_client().auth.get_user(
            credentials.credentials
        )

        if not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token.",
            )

        reviewer_id = str(response.user.id)

        if reviewer_id not in allowed_reviewers:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized as a reviewer.",
            )

        return reviewer_id

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed. Please sign in again.",
        ) from error