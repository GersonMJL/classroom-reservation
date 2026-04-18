from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Localizacao(Base):
    __tablename__ = "localizacoes"

    campus: Mapped[str] = mapped_column(String(255), nullable=False)
    predio: Mapped[str] = mapped_column(String(255), nullable=False)
    andar: Mapped[str] = mapped_column(String(64), nullable=False)

    ambientes = relationship("Ambiente", back_populates="localizacao")
    recursos = relationship("Recurso", back_populates="localizacao_atual")
