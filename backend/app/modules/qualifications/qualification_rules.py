from fastapi import HTTPException, status


def assert_qualifications_met(*, required_ids: list[int], held_ids: list[int]) -> None:
    """Lança HTTP 422 se alguma qualificação exigida não estiver em held_ids."""
    missing = sorted(set(required_ids) - set(held_ids))
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Qualificações exigidas não atendidas: {missing}",
        )
