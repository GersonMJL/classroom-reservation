"""Regras puras de validação de ambiente (UC01 E1/E2)."""

from fastapi import HTTPException, status


def assert_unique_code(*, existing_id: int | None) -> None:
    """``existing_id`` é o id de um ambiente que já usa o código (ou None)."""
    if existing_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um ambiente com este código",
        )


def assert_capacity_not_below_confirmed(
    *, new_capacity: int, max_confirmed: int
) -> None:
    if new_capacity < max_confirmed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Capacidade ({new_capacity}) menor que reservas confirmadas "
                f"({max_confirmed} participantes)"
            ),
        )
