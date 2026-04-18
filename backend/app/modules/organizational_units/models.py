from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.users.models import Usuario


class UnidadeOrganizacional(Base):
    __tablename__ = "unidades_organizacionais"

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)

    usuarios: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="unidade_organizacional"
    )
