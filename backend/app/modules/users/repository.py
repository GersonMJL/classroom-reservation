from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.models import Papel, Usuario, UsuarioPapel
from app.modules.users.schemas import UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, *, skip: int = 0, limit: int = 100) -> list[Usuario]:
        query = select(Usuario)
        return list(self.db.execute(query.offset(skip).limit(limit)).scalars().all())

    def _sync_papeis(self, usuario: Usuario, nomes: list[str]) -> None:
        normalizados = sorted({n.strip() for n in nomes if n.strip()})
        if not normalizados:
            usuario.usuario_papeis = []
            return

        papeis_existentes = list(
            self.db.execute(select(Papel).where(Papel.nome.in_(normalizados)))
            .scalars()
            .all()
        )
        por_nome = {p.nome: p for p in papeis_existentes}

        for nome in normalizados:
            if nome not in por_nome:
                papel = Papel(codigo=nome.lower().replace(" ", "_"), nome=nome)
                self.db.add(papel)
                papeis_existentes.append(papel)

        self.db.flush()
        por_nome = {p.nome: p for p in papeis_existentes}
        usuario.usuario_papeis = [
            UsuarioPapel(usuario=usuario, papel=por_nome[nome])
            for nome in normalizados
        ]

    def get_by_id(self, user_id: int) -> Usuario | None:
        return self.db.get(Usuario, user_id)

    def get_by_email(self, email: str) -> Usuario | None:
        query = select(Usuario).where(Usuario.email == email)
        return self.db.execute(query).scalar_one_or_none()

    def create(self, payload: UserCreate) -> Usuario:
        usuario = Usuario(
            nome=payload.nome,
            email=str(payload.email),
            senha_hash=payload.senha,
            ativo=payload.ativo,
        )
        self.db.add(usuario)
        self.db.flush()
        self._sync_papeis(usuario, payload.papeis)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def update(self, usuario: Usuario, payload: UserUpdate) -> Usuario:
        if payload.nome is not None:
            usuario.nome = payload.nome
        if payload.email is not None:
            usuario.email = str(payload.email)
        if payload.ativo is not None:
            usuario.ativo = payload.ativo
        if payload.papeis is not None:
            self._sync_papeis(usuario, payload.papeis)
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def delete(self, usuario: Usuario) -> None:
        self.db.delete(usuario)
        self.db.commit()
