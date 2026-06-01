"""Regra pura: consistência entre tipo de vínculo e ambiente (UC02)."""

from fastapi import HTTPException, status


def assert_attachment_consistency(
    *, attachment_type: str, environment_id: int | None
) -> None:
    if attachment_type == "FIXED" and environment_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Recurso fixo exige um ambiente de instalação",
        )
    if attachment_type == "MOBILE" and environment_id is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Recurso móvel não pode ter ambiente fixo de instalação",
        )
