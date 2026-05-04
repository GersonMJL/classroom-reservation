"""english

Revision ID: be9c17d27f3d
Revises: 89e39e5aaa73
Create Date: 2026-04-28 17:59:53.340054

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'be9c17d27f3d'
down_revision: str | Sequence[str] | None = '89e39e5aaa73'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Step 1: Rename tables
    op.rename_table('localizacoes', 'locations')
    op.rename_table('ambientes', 'environments')
    op.rename_table('politica_reserva', 'reservation_policies')
    op.rename_table('restricoes_ambiente', 'environment_restrictions')
    op.rename_table('requisitos_ambiente', 'environment_requirements')
    op.rename_table('manutencao_ambiente', 'environment_maintenance')
    op.rename_table('unidades_organizacionais', 'organizational_units')
    op.rename_table('usuarios', 'users')
    op.rename_table('papeis', 'roles')
    op.rename_table('usuario_papeis', 'user_roles')
    op.rename_table('qualificacoes', 'qualifications')
    op.rename_table('qualificacoes_usuario', 'user_qualifications')
    op.rename_table('recursos', 'resources')
    op.rename_table('disponibilidade_recurso', 'resource_availability')
    op.rename_table('escala_tecnico', 'technician_schedule')
    op.rename_table('manutencao_recurso', 'resource_maintenance')
    op.rename_table('reservas', 'reservations')
    op.rename_table('dependencias_reserva', 'reservation_dependencies')
    op.rename_table('recursos_reserva', 'reservation_resources')
    op.rename_table('suporte_reserva', 'reservation_support')
    op.rename_table('aprovacoes', 'approvals')
    op.rename_table('bloqueios_calendario', 'calendar_blocks')
    op.rename_table('historico_status_reserva', 'reservation_status_history')
    op.rename_table('buffer_execucao', 'execution_buffers')
    op.rename_table('reserva_composta', 'composite_reservations')
    op.rename_table('reserva_composta_item', 'composite_reservation_items')
    op.rename_table('penalidades', 'penalties')
    op.rename_table('apelos', 'appeals')
    op.rename_table('incidentes', 'incidents')
    op.rename_table('emprestimos_recurso', 'resource_loans')
    op.rename_table('versoes_reserva', 'reservation_versions')
    op.rename_table('registros_auditoria', 'audit_records')

    # Step 2: Migrate PostgreSQL ENUM types (columns still have Portuguese names here)

    # status_reserva → reservation_status
    op.execute("CREATE TYPE reservation_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'AWAITING_CHECKIN', 'IN_USE', 'AWAITING_CHECKOUT', 'COMPLETED', 'CANCELLED', 'NO_SHOW')")
    op.execute("""
        ALTER TABLE reservations ALTER COLUMN status TYPE reservation_status
        USING (CASE status::text
            WHEN 'RASCUNHO' THEN 'DRAFT'
            WHEN 'AGUARDANDO_APROVACAO' THEN 'PENDING_APPROVAL'
            WHEN 'APROVADA' THEN 'APPROVED'
            WHEN 'REJEITADA' THEN 'REJECTED'
            WHEN 'AGUARDANDO_CHECKIN' THEN 'AWAITING_CHECKIN'
            WHEN 'EM_USO' THEN 'IN_USE'
            WHEN 'AGUARDANDO_CHECKOUT' THEN 'AWAITING_CHECKOUT'
            WHEN 'CONCLUIDA' THEN 'COMPLETED'
            WHEN 'CANCELADA' THEN 'CANCELLED'
            WHEN 'NAO_COMPARECEU' THEN 'NO_SHOW'
        END::reservation_status)
    """)
    op.execute("""
        ALTER TABLE reservation_status_history ALTER COLUMN status_anterior TYPE reservation_status
        USING (CASE status_anterior::text
            WHEN 'RASCUNHO' THEN 'DRAFT'
            WHEN 'AGUARDANDO_APROVACAO' THEN 'PENDING_APPROVAL'
            WHEN 'APROVADA' THEN 'APPROVED'
            WHEN 'REJEITADA' THEN 'REJECTED'
            WHEN 'AGUARDANDO_CHECKIN' THEN 'AWAITING_CHECKIN'
            WHEN 'EM_USO' THEN 'IN_USE'
            WHEN 'AGUARDANDO_CHECKOUT' THEN 'AWAITING_CHECKOUT'
            WHEN 'CONCLUIDA' THEN 'COMPLETED'
            WHEN 'CANCELADA' THEN 'CANCELLED'
            WHEN 'NAO_COMPARECEU' THEN 'NO_SHOW'
        END::reservation_status)
    """)
    op.execute("""
        ALTER TABLE reservation_status_history ALTER COLUMN status_novo TYPE reservation_status
        USING (CASE status_novo::text
            WHEN 'RASCUNHO' THEN 'DRAFT'
            WHEN 'AGUARDANDO_APROVACAO' THEN 'PENDING_APPROVAL'
            WHEN 'APROVADA' THEN 'APPROVED'
            WHEN 'REJEITADA' THEN 'REJECTED'
            WHEN 'AGUARDANDO_CHECKIN' THEN 'AWAITING_CHECKIN'
            WHEN 'EM_USO' THEN 'IN_USE'
            WHEN 'AGUARDANDO_CHECKOUT' THEN 'AWAITING_CHECKOUT'
            WHEN 'CONCLUIDA' THEN 'COMPLETED'
            WHEN 'CANCELADA' THEN 'CANCELLED'
            WHEN 'NAO_COMPARECEU' THEN 'NO_SHOW'
        END::reservation_status)
    """)
    op.execute("DROP TYPE status_reserva")

    # tipo_reserva → reservation_type
    op.execute("CREATE TYPE reservation_type AS ENUM ('SIMPLE', 'RECURRING', 'COMPOSITE')")
    op.execute("""
        ALTER TABLE reservations ALTER COLUMN tipo TYPE reservation_type
        USING (CASE tipo::text
            WHEN 'SIMPLES' THEN 'SIMPLE'
            WHEN 'RECORRENTE' THEN 'RECURRING'
            WHEN 'COMPOSTA' THEN 'COMPOSITE'
        END::reservation_type)
    """)
    op.execute("DROP TYPE tipo_reserva")

    # status_aprovacao → approval_status
    op.execute("CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")
    op.execute("""
        ALTER TABLE approvals ALTER COLUMN status TYPE approval_status
        USING (CASE status::text
            WHEN 'PENDENTE' THEN 'PENDING'
            WHEN 'APROVADO' THEN 'APPROVED'
            WHEN 'REJEITADO' THEN 'REJECTED'
        END::approval_status)
    """)
    op.execute("DROP TYPE status_aprovacao")

    # tipo_bloqueio_calendario → calendar_block_type
    op.execute("CREATE TYPE calendar_block_type AS ENUM ('MAINTENANCE', 'HOLIDAY', 'EVENT', 'ADMIN_BLOCK')")
    op.execute("""
        ALTER TABLE calendar_blocks ALTER COLUMN tipo TYPE calendar_block_type
        USING (CASE tipo::text
            WHEN 'MANUTENCAO' THEN 'MAINTENANCE'
            WHEN 'FERIADO' THEN 'HOLIDAY'
            WHEN 'EVENTO' THEN 'EVENT'
            WHEN 'RESERVA_ADMIN' THEN 'ADMIN_BLOCK'
        END::calendar_block_type)
    """)
    op.execute("DROP TYPE tipo_bloqueio_calendario")

    # tipo_buffer → buffer_type
    op.execute("CREATE TYPE buffer_type AS ENUM ('PRE', 'POST')")
    op.execute("""
        ALTER TABLE execution_buffers ALTER COLUMN tipo TYPE buffer_type
        USING (CASE tipo::text
            WHEN 'PRE' THEN 'PRE'
            WHEN 'POS' THEN 'POST'
        END::buffer_type)
    """)
    op.execute("DROP TYPE tipo_buffer")

    # tipo_suporte → support_type
    op.execute("CREATE TYPE support_type AS ENUM ('TECHNICAL', 'CLEANING', 'SECURITY')")
    op.execute("""
        ALTER TABLE reservation_support ALTER COLUMN tipo_suporte TYPE support_type
        USING (CASE tipo_suporte::text
            WHEN 'TECNICO' THEN 'TECHNICAL'
            WHEN 'LIMPEZA' THEN 'CLEANING'
            WHEN 'SEGURANCA' THEN 'SECURITY'
        END::support_type)
    """)
    op.execute("DROP TYPE tipo_suporte")

    # Step 3: Rename columns

    # locations
    op.alter_column('locations', 'predio', new_column_name='building')
    op.alter_column('locations', 'andar', new_column_name='floor')

    # environments
    op.alter_column('environments', 'nome', new_column_name='name')
    op.alter_column('environments', 'tipo', new_column_name='type')
    op.alter_column('environments', 'criticidade', new_column_name='criticality')
    op.alter_column('environments', 'capacidade', new_column_name='capacity')
    op.alter_column('environments', 'localizacao_id', new_column_name='location_id')
    op.alter_column('environments', 'horario_funcionamento', new_column_name='operating_hours')
    op.alter_column('environments', 'requer_aprovacao', new_column_name='requires_approval')
    op.alter_column('environments', 'buffer_antes_min', new_column_name='buffer_before_min')
    op.alter_column('environments', 'buffer_depois_min', new_column_name='buffer_after_min')
    op.alter_column('environments', 'ativo', new_column_name='active')

    # reservation_policies
    op.alter_column('reservation_policies', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('reservation_policies', 'papel_id', new_column_name='role_id')
    op.alter_column('reservation_policies', 'antecedencia_min_horas', new_column_name='min_lead_time_hours')
    op.alter_column('reservation_policies', 'antecedencia_max_dias', new_column_name='max_lead_time_days')

    # environment_restrictions
    op.alter_column('environment_restrictions', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('environment_restrictions', 'tipo', new_column_name='type')
    op.alter_column('environment_restrictions', 'descricao', new_column_name='description')

    # environment_requirements
    op.alter_column('environment_requirements', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('environment_requirements', 'qualificacao_id', new_column_name='qualification_id')

    # environment_maintenance
    op.alter_column('environment_maintenance', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('environment_maintenance', 'data_inicio', new_column_name='start_date')
    op.alter_column('environment_maintenance', 'data_fim', new_column_name='end_date')
    op.alter_column('environment_maintenance', 'motivo', new_column_name='reason')

    # organizational_units
    op.alter_column('organizational_units', 'nome', new_column_name='name')
    op.alter_column('organizational_units', 'tipo', new_column_name='type')

    # users
    op.alter_column('users', 'nome', new_column_name='name')
    op.alter_column('users', 'senha_hash', new_column_name='password_hash')
    op.alter_column('users', 'unidade_organizacional_id', new_column_name='organizational_unit_id')
    op.alter_column('users', 'ativo', new_column_name='active')

    # roles
    op.alter_column('roles', 'codigo', new_column_name='code')
    op.alter_column('roles', 'nome', new_column_name='name')

    # user_roles
    op.alter_column('user_roles', 'usuario_id', new_column_name='user_id')
    op.alter_column('user_roles', 'papel_id', new_column_name='role_id')

    # qualifications
    op.alter_column('qualifications', 'nome', new_column_name='name')
    op.alter_column('qualifications', 'descricao', new_column_name='description')

    # user_qualifications
    op.alter_column('user_qualifications', 'usuario_id', new_column_name='user_id')
    op.alter_column('user_qualifications', 'qualificacao_id', new_column_name='qualification_id')
    op.alter_column('user_qualifications', 'valido_ate', new_column_name='valid_until')

    # resources
    op.alter_column('resources', 'nome', new_column_name='name')
    op.alter_column('resources', 'tipo', new_column_name='type')
    op.alter_column('resources', 'categoria', new_column_name='category')
    op.alter_column('resources', 'tipo_vinculo', new_column_name='attachment_type')
    op.alter_column('resources', 'ativo', new_column_name='active')
    op.alter_column('resources', 'localizacao_atual_id', new_column_name='current_location_id')
    op.alter_column('resources', 'ambiente_id', new_column_name='environment_id')

    # resource_availability
    op.alter_column('resource_availability', 'recurso_id', new_column_name='resource_id')
    op.alter_column('resource_availability', 'inicio', new_column_name='start')
    op.alter_column('resource_availability', 'fim', new_column_name='end')
    op.alter_column('resource_availability', 'disponivel', new_column_name='available')
    op.alter_column('resource_availability', 'motivo', new_column_name='reason')

    # technician_schedule
    op.alter_column('technician_schedule', 'tecnico_id', new_column_name='technician_id')
    op.alter_column('technician_schedule', 'recurso_id', new_column_name='resource_id')
    op.alter_column('technician_schedule', 'data_inicio', new_column_name='start_date')
    op.alter_column('technician_schedule', 'data_fim', new_column_name='end_date')

    # resource_maintenance
    op.alter_column('resource_maintenance', 'recurso_id', new_column_name='resource_id')
    op.alter_column('resource_maintenance', 'data_inicio', new_column_name='start_date')
    op.alter_column('resource_maintenance', 'data_fim', new_column_name='end_date')
    op.alter_column('resource_maintenance', 'motivo', new_column_name='reason')

    # reservations
    op.alter_column('reservations', 'reserva_mestre_id', new_column_name='parent_reservation_id')
    op.alter_column('reservations', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('reservations', 'solicitante_id', new_column_name='requester_id')
    op.alter_column('reservations', 'responsavel_id', new_column_name='responsible_id')
    op.alter_column('reservations', 'hora_inicio', new_column_name='start_time')
    op.alter_column('reservations', 'hora_fim', new_column_name='end_time')
    op.alter_column('reservations', 'tipo', new_column_name='type')
    op.alter_column('reservations', 'num_participantes', new_column_name='participant_count')
    op.alter_column('reservations', 'proposito', new_column_name='purpose')
    op.alter_column('reservations', 'regra_recorrencia', new_column_name='recurrence_rule')

    # reservation_dependencies
    op.alter_column('reservation_dependencies', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('reservation_dependencies', 'depende_de_reserva_id', new_column_name='dependent_reservation_id')

    # reservation_resources
    op.alter_column('reservation_resources', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('reservation_resources', 'recurso_id', new_column_name='resource_id')

    # reservation_support (tipo_suporte column name unchanged)
    op.alter_column('reservation_support', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('reservation_support', 'funcionario_responsavel_id', new_column_name='responsible_staff_id')

    # approvals
    op.alter_column('approvals', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('approvals', 'aprovador_id', new_column_name='approver_id')
    op.alter_column('approvals', 'tipo', new_column_name='type')
    op.alter_column('approvals', 'data_decisao', new_column_name='decision_date')
    op.alter_column('approvals', 'comentarios', new_column_name='comments')

    # calendar_blocks
    op.alter_column('calendar_blocks', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('calendar_blocks', 'hora_inicio', new_column_name='start_time')
    op.alter_column('calendar_blocks', 'hora_fim', new_column_name='end_time')
    op.alter_column('calendar_blocks', 'tipo', new_column_name='type')
    op.alter_column('calendar_blocks', 'prioridade', new_column_name='priority')

    # reservation_status_history
    op.alter_column('reservation_status_history', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('reservation_status_history', 'status_anterior', new_column_name='previous_status')
    op.alter_column('reservation_status_history', 'status_novo', new_column_name='new_status')
    op.alter_column('reservation_status_history', 'data_mudanca', new_column_name='changed_at')
    op.alter_column('reservation_status_history', 'motivo', new_column_name='reason')
    op.alter_column('reservation_status_history', 'usuario_id', new_column_name='user_id')

    # execution_buffers
    op.alter_column('execution_buffers', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('execution_buffers', 'ambiente_id', new_column_name='environment_id')
    op.alter_column('execution_buffers', 'tipo', new_column_name='type')
    op.alter_column('execution_buffers', 'hora_prevista_fim', new_column_name='expected_end_time')
    op.alter_column('execution_buffers', 'hora_real_fim', new_column_name='actual_end_time')
    op.alter_column('execution_buffers', 'liberado_por', new_column_name='released_by')
    op.alter_column('execution_buffers', 'observacao', new_column_name='notes')

    # composite_reservations
    op.alter_column('composite_reservations', 'nome', new_column_name='name')
    op.alter_column('composite_reservations', 'descricao', new_column_name='description')

    # composite_reservation_items
    op.alter_column('composite_reservation_items', 'reserva_composta_id', new_column_name='composite_reservation_id')
    op.alter_column('composite_reservation_items', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('composite_reservation_items', 'critico', new_column_name='critical')
    op.alter_column('composite_reservation_items', 'ordem', new_column_name='order')

    # penalties
    op.alter_column('penalties', 'usuario_id', new_column_name='user_id')
    op.alter_column('penalties', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('penalties', 'tipo', new_column_name='type')
    op.alter_column('penalties', 'descricao', new_column_name='description')
    op.alter_column('penalties', 'duracao_dias', new_column_name='duration_days')
    op.alter_column('penalties', 'data_inicio', new_column_name='start_date')
    op.alter_column('penalties', 'data_fim', new_column_name='end_date')
    op.alter_column('penalties', 'aplicada_por', new_column_name='applied_by')

    # appeals
    op.alter_column('appeals', 'penalidade_id', new_column_name='penalty_id')
    op.alter_column('appeals', 'notas_resolucao', new_column_name='resolution_notes')

    # incidents
    op.alter_column('incidents', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('incidents', 'descricao', new_column_name='description')
    op.alter_column('incidents', 'severidade', new_column_name='severity')
    op.alter_column('incidents', 'reportado_em', new_column_name='reported_at')

    # resource_loans
    op.alter_column('resource_loans', 'recurso_id', new_column_name='resource_id')
    op.alter_column('resource_loans', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('resource_loans', 'hora_retirada', new_column_name='checkout_time')
    op.alter_column('resource_loans', 'hora_devolucao_prevista', new_column_name='expected_return_time')
    op.alter_column('resource_loans', 'hora_devolucao', new_column_name='return_time')

    # reservation_versions
    op.alter_column('reservation_versions', 'reserva_id', new_column_name='reservation_id')
    op.alter_column('reservation_versions', 'alterado_por', new_column_name='changed_by')
    op.alter_column('reservation_versions', 'alterado_em', new_column_name='changed_at')
    op.alter_column('reservation_versions', 'resumo_alteracao', new_column_name='change_summary')

    # audit_records
    op.alter_column('audit_records', 'tipo_entidade', new_column_name='entity_type')
    op.alter_column('audit_records', 'id_alvo', new_column_name='target_id')
    op.alter_column('audit_records', 'acao', new_column_name='action')
    op.alter_column('audit_records', 'realizado_por', new_column_name='performed_by')
    op.alter_column('audit_records', 'realizado_em', new_column_name='performed_at')
    op.alter_column('audit_records', 'estado_anterior', new_column_name='before_state')
    op.alter_column('audit_records', 'estado_posterior', new_column_name='after_state')

    # Step 4: Rename indexes
    op.execute("ALTER INDEX ix_localizacoes_id RENAME TO ix_locations_id")
    op.execute("ALTER INDEX ix_ambientes_id RENAME TO ix_environments_id")
    op.execute("ALTER INDEX ix_politica_reserva_id RENAME TO ix_reservation_policies_id")
    op.execute("ALTER INDEX ix_restricoes_ambiente_id RENAME TO ix_environment_restrictions_id")
    op.execute("ALTER INDEX ix_requisitos_ambiente_id RENAME TO ix_environment_requirements_id")
    op.execute("ALTER INDEX ix_manutencao_ambiente_id RENAME TO ix_environment_maintenance_id")
    op.execute("ALTER INDEX ix_unidades_organizacionais_id RENAME TO ix_organizational_units_id")
    op.execute("ALTER INDEX ix_usuarios_id RENAME TO ix_users_id")
    op.execute("ALTER INDEX ix_usuarios_email RENAME TO ix_users_email")
    op.execute("ALTER INDEX ix_papeis_id RENAME TO ix_roles_id")
    op.execute("ALTER INDEX ix_papeis_codigo RENAME TO ix_roles_code")
    op.execute("ALTER INDEX ix_papeis_nome RENAME TO ix_roles_name")
    op.execute("ALTER INDEX ix_usuario_papeis_id RENAME TO ix_user_roles_id")
    op.execute("ALTER INDEX ix_qualificacoes_id RENAME TO ix_qualifications_id")
    op.execute("ALTER INDEX ix_qualificacoes_usuario_id RENAME TO ix_user_qualifications_id")
    op.execute("ALTER INDEX ix_recursos_id RENAME TO ix_resources_id")
    op.execute("ALTER INDEX ix_disponibilidade_recurso_id RENAME TO ix_resource_availability_id")
    op.execute("ALTER INDEX ix_escala_tecnico_id RENAME TO ix_technician_schedule_id")
    op.execute("ALTER INDEX ix_manutencao_recurso_id RENAME TO ix_resource_maintenance_id")
    op.execute("ALTER INDEX ix_reservas_id RENAME TO ix_reservations_id")
    op.execute("ALTER INDEX ix_dependencias_reserva_id RENAME TO ix_reservation_dependencies_id")
    op.execute("ALTER INDEX ix_recursos_reserva_id RENAME TO ix_reservation_resources_id")
    op.execute("ALTER INDEX ix_suporte_reserva_id RENAME TO ix_reservation_support_id")
    op.execute("ALTER INDEX ix_aprovacoes_id RENAME TO ix_approvals_id")
    op.execute("ALTER INDEX ix_bloqueios_calendario_id RENAME TO ix_calendar_blocks_id")
    op.execute("ALTER INDEX ix_historico_status_reserva_id RENAME TO ix_reservation_status_history_id")
    op.execute("ALTER INDEX ix_buffer_execucao_id RENAME TO ix_execution_buffers_id")
    op.execute("ALTER INDEX ix_reserva_composta_id RENAME TO ix_composite_reservations_id")
    op.execute("ALTER INDEX ix_reserva_composta_item_id RENAME TO ix_composite_reservation_items_id")
    op.execute("ALTER INDEX ix_penalidades_id RENAME TO ix_penalties_id")
    op.execute("ALTER INDEX ix_apelos_id RENAME TO ix_appeals_id")
    op.execute("ALTER INDEX ix_incidentes_id RENAME TO ix_incidents_id")
    op.execute("ALTER INDEX ix_emprestimos_recurso_id RENAME TO ix_resource_loans_id")
    op.execute("ALTER INDEX ix_versoes_reserva_id RENAME TO ix_reservation_versions_id")
    op.execute("ALTER INDEX ix_registros_auditoria_id RENAME TO ix_audit_records_id")

    # Rename constraints
    op.execute("ALTER TABLE user_roles RENAME CONSTRAINT uq_usuario_papel TO uq_user_role")
    op.execute("ALTER TABLE composite_reservation_items RENAME CONSTRAINT uq_reserva_composta_item TO uq_composite_reservation_item")


def downgrade() -> None:
    # Step 1: Rename constraints back
    op.execute("ALTER TABLE composite_reservation_items RENAME CONSTRAINT uq_composite_reservation_item TO uq_reserva_composta_item")
    op.execute("ALTER TABLE user_roles RENAME CONSTRAINT uq_user_role TO uq_usuario_papel")

    # Step 2: Rename indexes back
    op.execute("ALTER INDEX ix_audit_records_id RENAME TO ix_registros_auditoria_id")
    op.execute("ALTER INDEX ix_reservation_versions_id RENAME TO ix_versoes_reserva_id")
    op.execute("ALTER INDEX ix_resource_loans_id RENAME TO ix_emprestimos_recurso_id")
    op.execute("ALTER INDEX ix_incidents_id RENAME TO ix_incidentes_id")
    op.execute("ALTER INDEX ix_appeals_id RENAME TO ix_apelos_id")
    op.execute("ALTER INDEX ix_penalties_id RENAME TO ix_penalidades_id")
    op.execute("ALTER INDEX ix_composite_reservation_items_id RENAME TO ix_reserva_composta_item_id")
    op.execute("ALTER INDEX ix_composite_reservations_id RENAME TO ix_reserva_composta_id")
    op.execute("ALTER INDEX ix_execution_buffers_id RENAME TO ix_buffer_execucao_id")
    op.execute("ALTER INDEX ix_reservation_status_history_id RENAME TO ix_historico_status_reserva_id")
    op.execute("ALTER INDEX ix_calendar_blocks_id RENAME TO ix_bloqueios_calendario_id")
    op.execute("ALTER INDEX ix_approvals_id RENAME TO ix_aprovacoes_id")
    op.execute("ALTER INDEX ix_reservation_support_id RENAME TO ix_suporte_reserva_id")
    op.execute("ALTER INDEX ix_reservation_resources_id RENAME TO ix_recursos_reserva_id")
    op.execute("ALTER INDEX ix_reservation_dependencies_id RENAME TO ix_dependencias_reserva_id")
    op.execute("ALTER INDEX ix_reservations_id RENAME TO ix_reservas_id")
    op.execute("ALTER INDEX ix_resource_maintenance_id RENAME TO ix_manutencao_recurso_id")
    op.execute("ALTER INDEX ix_technician_schedule_id RENAME TO ix_escala_tecnico_id")
    op.execute("ALTER INDEX ix_resource_availability_id RENAME TO ix_disponibilidade_recurso_id")
    op.execute("ALTER INDEX ix_resources_id RENAME TO ix_recursos_id")
    op.execute("ALTER INDEX ix_user_qualifications_id RENAME TO ix_qualificacoes_usuario_id")
    op.execute("ALTER INDEX ix_qualifications_id RENAME TO ix_qualificacoes_id")
    op.execute("ALTER INDEX ix_user_roles_id RENAME TO ix_usuario_papeis_id")
    op.execute("ALTER INDEX ix_roles_name RENAME TO ix_papeis_nome")
    op.execute("ALTER INDEX ix_roles_code RENAME TO ix_papeis_codigo")
    op.execute("ALTER INDEX ix_roles_id RENAME TO ix_papeis_id")
    op.execute("ALTER INDEX ix_users_email RENAME TO ix_usuarios_email")
    op.execute("ALTER INDEX ix_users_id RENAME TO ix_usuarios_id")
    op.execute("ALTER INDEX ix_organizational_units_id RENAME TO ix_unidades_organizacionais_id")
    op.execute("ALTER INDEX ix_environment_maintenance_id RENAME TO ix_manutencao_ambiente_id")
    op.execute("ALTER INDEX ix_environment_requirements_id RENAME TO ix_requisitos_ambiente_id")
    op.execute("ALTER INDEX ix_environment_restrictions_id RENAME TO ix_restricoes_ambiente_id")
    op.execute("ALTER INDEX ix_reservation_policies_id RENAME TO ix_politica_reserva_id")
    op.execute("ALTER INDEX ix_environments_id RENAME TO ix_ambientes_id")
    op.execute("ALTER INDEX ix_locations_id RENAME TO ix_localizacoes_id")

    # Step 3: Rename columns back

    # audit_records
    op.alter_column('audit_records', 'after_state', new_column_name='estado_posterior')
    op.alter_column('audit_records', 'before_state', new_column_name='estado_anterior')
    op.alter_column('audit_records', 'performed_at', new_column_name='realizado_em')
    op.alter_column('audit_records', 'performed_by', new_column_name='realizado_por')
    op.alter_column('audit_records', 'action', new_column_name='acao')
    op.alter_column('audit_records', 'target_id', new_column_name='id_alvo')
    op.alter_column('audit_records', 'entity_type', new_column_name='tipo_entidade')

    # reservation_versions
    op.alter_column('reservation_versions', 'change_summary', new_column_name='resumo_alteracao')
    op.alter_column('reservation_versions', 'changed_at', new_column_name='alterado_em')
    op.alter_column('reservation_versions', 'changed_by', new_column_name='alterado_por')
    op.alter_column('reservation_versions', 'reservation_id', new_column_name='reserva_id')

    # resource_loans
    op.alter_column('resource_loans', 'return_time', new_column_name='hora_devolucao')
    op.alter_column('resource_loans', 'expected_return_time', new_column_name='hora_devolucao_prevista')
    op.alter_column('resource_loans', 'checkout_time', new_column_name='hora_retirada')
    op.alter_column('resource_loans', 'reservation_id', new_column_name='reserva_id')
    op.alter_column('resource_loans', 'resource_id', new_column_name='recurso_id')

    # incidents
    op.alter_column('incidents', 'reported_at', new_column_name='reportado_em')
    op.alter_column('incidents', 'severity', new_column_name='severidade')
    op.alter_column('incidents', 'description', new_column_name='descricao')
    op.alter_column('incidents', 'reservation_id', new_column_name='reserva_id')

    # appeals
    op.alter_column('appeals', 'resolution_notes', new_column_name='notas_resolucao')
    op.alter_column('appeals', 'penalty_id', new_column_name='penalidade_id')

    # penalties
    op.alter_column('penalties', 'applied_by', new_column_name='aplicada_por')
    op.alter_column('penalties', 'end_date', new_column_name='data_fim')
    op.alter_column('penalties', 'start_date', new_column_name='data_inicio')
    op.alter_column('penalties', 'duration_days', new_column_name='duracao_dias')
    op.alter_column('penalties', 'description', new_column_name='descricao')
    op.alter_column('penalties', 'type', new_column_name='tipo')
    op.alter_column('penalties', 'reservation_id', new_column_name='reserva_id')
    op.alter_column('penalties', 'user_id', new_column_name='usuario_id')

    # composite_reservation_items
    op.alter_column('composite_reservation_items', 'order', new_column_name='ordem')
    op.alter_column('composite_reservation_items', 'critical', new_column_name='critico')
    op.alter_column('composite_reservation_items', 'reservation_id', new_column_name='reserva_id')
    op.alter_column('composite_reservation_items', 'composite_reservation_id', new_column_name='reserva_composta_id')

    # composite_reservations
    op.alter_column('composite_reservations', 'description', new_column_name='descricao')
    op.alter_column('composite_reservations', 'name', new_column_name='nome')

    # execution_buffers
    op.alter_column('execution_buffers', 'notes', new_column_name='observacao')
    op.alter_column('execution_buffers', 'released_by', new_column_name='liberado_por')
    op.alter_column('execution_buffers', 'actual_end_time', new_column_name='hora_real_fim')
    op.alter_column('execution_buffers', 'expected_end_time', new_column_name='hora_prevista_fim')
    op.alter_column('execution_buffers', 'type', new_column_name='tipo')
    op.alter_column('execution_buffers', 'environment_id', new_column_name='ambiente_id')
    op.alter_column('execution_buffers', 'reservation_id', new_column_name='reserva_id')

    # reservation_status_history
    op.alter_column('reservation_status_history', 'user_id', new_column_name='usuario_id')
    op.alter_column('reservation_status_history', 'reason', new_column_name='motivo')
    op.alter_column('reservation_status_history', 'changed_at', new_column_name='data_mudanca')
    op.alter_column('reservation_status_history', 'new_status', new_column_name='status_novo')
    op.alter_column('reservation_status_history', 'previous_status', new_column_name='status_anterior')
    op.alter_column('reservation_status_history', 'reservation_id', new_column_name='reserva_id')

    # calendar_blocks
    op.alter_column('calendar_blocks', 'priority', new_column_name='prioridade')
    op.alter_column('calendar_blocks', 'type', new_column_name='tipo')
    op.alter_column('calendar_blocks', 'end_time', new_column_name='hora_fim')
    op.alter_column('calendar_blocks', 'start_time', new_column_name='hora_inicio')
    op.alter_column('calendar_blocks', 'environment_id', new_column_name='ambiente_id')

    # approvals
    op.alter_column('approvals', 'comments', new_column_name='comentarios')
    op.alter_column('approvals', 'decision_date', new_column_name='data_decisao')
    op.alter_column('approvals', 'type', new_column_name='tipo')
    op.alter_column('approvals', 'approver_id', new_column_name='aprovador_id')
    op.alter_column('approvals', 'reservation_id', new_column_name='reserva_id')

    # reservation_support
    op.alter_column('reservation_support', 'responsible_staff_id', new_column_name='funcionario_responsavel_id')
    op.alter_column('reservation_support', 'reservation_id', new_column_name='reserva_id')

    # reservation_resources
    op.alter_column('reservation_resources', 'resource_id', new_column_name='recurso_id')
    op.alter_column('reservation_resources', 'reservation_id', new_column_name='reserva_id')

    # reservation_dependencies
    op.alter_column('reservation_dependencies', 'dependent_reservation_id', new_column_name='depende_de_reserva_id')
    op.alter_column('reservation_dependencies', 'reservation_id', new_column_name='reserva_id')

    # reservations
    op.alter_column('reservations', 'recurrence_rule', new_column_name='regra_recorrencia')
    op.alter_column('reservations', 'purpose', new_column_name='proposito')
    op.alter_column('reservations', 'participant_count', new_column_name='num_participantes')
    op.alter_column('reservations', 'type', new_column_name='tipo')
    op.alter_column('reservations', 'end_time', new_column_name='hora_fim')
    op.alter_column('reservations', 'start_time', new_column_name='hora_inicio')
    op.alter_column('reservations', 'responsible_id', new_column_name='responsavel_id')
    op.alter_column('reservations', 'requester_id', new_column_name='solicitante_id')
    op.alter_column('reservations', 'environment_id', new_column_name='ambiente_id')
    op.alter_column('reservations', 'parent_reservation_id', new_column_name='reserva_mestre_id')

    # resource_maintenance
    op.alter_column('resource_maintenance', 'reason', new_column_name='motivo')
    op.alter_column('resource_maintenance', 'end_date', new_column_name='data_fim')
    op.alter_column('resource_maintenance', 'start_date', new_column_name='data_inicio')
    op.alter_column('resource_maintenance', 'resource_id', new_column_name='recurso_id')

    # technician_schedule
    op.alter_column('technician_schedule', 'end_date', new_column_name='data_fim')
    op.alter_column('technician_schedule', 'start_date', new_column_name='data_inicio')
    op.alter_column('technician_schedule', 'resource_id', new_column_name='recurso_id')
    op.alter_column('technician_schedule', 'technician_id', new_column_name='tecnico_id')

    # resource_availability
    op.alter_column('resource_availability', 'reason', new_column_name='motivo')
    op.alter_column('resource_availability', 'available', new_column_name='disponivel')
    op.alter_column('resource_availability', 'end', new_column_name='fim')
    op.alter_column('resource_availability', 'start', new_column_name='inicio')
    op.alter_column('resource_availability', 'resource_id', new_column_name='recurso_id')

    # resources
    op.alter_column('resources', 'environment_id', new_column_name='ambiente_id')
    op.alter_column('resources', 'current_location_id', new_column_name='localizacao_atual_id')
    op.alter_column('resources', 'active', new_column_name='ativo')
    op.alter_column('resources', 'attachment_type', new_column_name='tipo_vinculo')
    op.alter_column('resources', 'category', new_column_name='categoria')
    op.alter_column('resources', 'type', new_column_name='tipo')
    op.alter_column('resources', 'name', new_column_name='nome')

    # user_qualifications
    op.alter_column('user_qualifications', 'valid_until', new_column_name='valido_ate')
    op.alter_column('user_qualifications', 'qualification_id', new_column_name='qualificacao_id')
    op.alter_column('user_qualifications', 'user_id', new_column_name='usuario_id')

    # qualifications
    op.alter_column('qualifications', 'description', new_column_name='descricao')
    op.alter_column('qualifications', 'name', new_column_name='nome')

    # user_roles
    op.alter_column('user_roles', 'role_id', new_column_name='papel_id')
    op.alter_column('user_roles', 'user_id', new_column_name='usuario_id')

    # roles
    op.alter_column('roles', 'name', new_column_name='nome')
    op.alter_column('roles', 'code', new_column_name='codigo')

    # users
    op.alter_column('users', 'active', new_column_name='ativo')
    op.alter_column('users', 'organizational_unit_id', new_column_name='unidade_organizacional_id')
    op.alter_column('users', 'password_hash', new_column_name='senha_hash')
    op.alter_column('users', 'name', new_column_name='nome')

    # organizational_units
    op.alter_column('organizational_units', 'type', new_column_name='tipo')
    op.alter_column('organizational_units', 'name', new_column_name='nome')

    # environment_maintenance
    op.alter_column('environment_maintenance', 'reason', new_column_name='motivo')
    op.alter_column('environment_maintenance', 'end_date', new_column_name='data_fim')
    op.alter_column('environment_maintenance', 'start_date', new_column_name='data_inicio')
    op.alter_column('environment_maintenance', 'environment_id', new_column_name='ambiente_id')

    # environment_requirements
    op.alter_column('environment_requirements', 'qualification_id', new_column_name='qualificacao_id')
    op.alter_column('environment_requirements', 'environment_id', new_column_name='ambiente_id')

    # environment_restrictions
    op.alter_column('environment_restrictions', 'description', new_column_name='descricao')
    op.alter_column('environment_restrictions', 'type', new_column_name='tipo')
    op.alter_column('environment_restrictions', 'environment_id', new_column_name='ambiente_id')

    # reservation_policies
    op.alter_column('reservation_policies', 'max_lead_time_days', new_column_name='antecedencia_max_dias')
    op.alter_column('reservation_policies', 'min_lead_time_hours', new_column_name='antecedencia_min_horas')
    op.alter_column('reservation_policies', 'role_id', new_column_name='papel_id')
    op.alter_column('reservation_policies', 'environment_id', new_column_name='ambiente_id')

    # environments
    op.alter_column('environments', 'active', new_column_name='ativo')
    op.alter_column('environments', 'buffer_after_min', new_column_name='buffer_depois_min')
    op.alter_column('environments', 'buffer_before_min', new_column_name='buffer_antes_min')
    op.alter_column('environments', 'requires_approval', new_column_name='requer_aprovacao')
    op.alter_column('environments', 'operating_hours', new_column_name='horario_funcionamento')
    op.alter_column('environments', 'location_id', new_column_name='localizacao_id')
    op.alter_column('environments', 'capacity', new_column_name='capacidade')
    op.alter_column('environments', 'criticality', new_column_name='criticidade')
    op.alter_column('environments', 'type', new_column_name='tipo')
    op.alter_column('environments', 'name', new_column_name='nome')

    # locations
    op.alter_column('locations', 'floor', new_column_name='andar')
    op.alter_column('locations', 'building', new_column_name='predio')

    # Step 4: Revert ENUM types (columns now have Portuguese names, tables still have English names)

    # support_type → tipo_suporte
    op.execute("CREATE TYPE tipo_suporte AS ENUM ('TECNICO', 'LIMPEZA', 'SEGURANCA')")
    op.execute("""
        ALTER TABLE reservation_support ALTER COLUMN tipo_suporte TYPE tipo_suporte
        USING (CASE tipo_suporte::text
            WHEN 'TECHNICAL' THEN 'TECNICO'
            WHEN 'CLEANING' THEN 'LIMPEZA'
            WHEN 'SECURITY' THEN 'SEGURANCA'
        END::tipo_suporte)
    """)
    op.execute("DROP TYPE support_type")

    # buffer_type → tipo_buffer
    op.execute("CREATE TYPE tipo_buffer AS ENUM ('PRE', 'POS')")
    op.execute("""
        ALTER TABLE execution_buffers ALTER COLUMN tipo TYPE tipo_buffer
        USING (CASE tipo::text
            WHEN 'PRE' THEN 'PRE'
            WHEN 'POST' THEN 'POS'
        END::tipo_buffer)
    """)
    op.execute("DROP TYPE buffer_type")

    # calendar_block_type → tipo_bloqueio_calendario
    op.execute("CREATE TYPE tipo_bloqueio_calendario AS ENUM ('MANUTENCAO', 'FERIADO', 'EVENTO', 'RESERVA_ADMIN')")
    op.execute("""
        ALTER TABLE calendar_blocks ALTER COLUMN tipo TYPE tipo_bloqueio_calendario
        USING (CASE tipo::text
            WHEN 'MAINTENANCE' THEN 'MANUTENCAO'
            WHEN 'HOLIDAY' THEN 'FERIADO'
            WHEN 'EVENT' THEN 'EVENTO'
            WHEN 'ADMIN_BLOCK' THEN 'RESERVA_ADMIN'
        END::tipo_bloqueio_calendario)
    """)
    op.execute("DROP TYPE calendar_block_type")

    # approval_status → status_aprovacao
    op.execute("CREATE TYPE status_aprovacao AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO')")
    op.execute("""
        ALTER TABLE approvals ALTER COLUMN status TYPE status_aprovacao
        USING (CASE status::text
            WHEN 'PENDING' THEN 'PENDENTE'
            WHEN 'APPROVED' THEN 'APROVADO'
            WHEN 'REJECTED' THEN 'REJEITADO'
        END::status_aprovacao)
    """)
    op.execute("DROP TYPE approval_status")

    # reservation_type → tipo_reserva
    op.execute("CREATE TYPE tipo_reserva AS ENUM ('SIMPLES', 'RECORRENTE', 'COMPOSTA')")
    op.execute("""
        ALTER TABLE reservations ALTER COLUMN tipo TYPE tipo_reserva
        USING (CASE tipo::text
            WHEN 'SIMPLE' THEN 'SIMPLES'
            WHEN 'RECURRING' THEN 'RECORRENTE'
            WHEN 'COMPOSITE' THEN 'COMPOSTA'
        END::tipo_reserva)
    """)
    op.execute("DROP TYPE reservation_type")

    # reservation_status → status_reserva
    op.execute("CREATE TYPE status_reserva AS ENUM ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'REJEITADA', 'AGUARDANDO_CHECKIN', 'EM_USO', 'AGUARDANDO_CHECKOUT', 'CONCLUIDA', 'CANCELADA', 'NAO_COMPARECEU')")
    op.execute("""
        ALTER TABLE reservations ALTER COLUMN status TYPE status_reserva
        USING (CASE status::text
            WHEN 'DRAFT' THEN 'RASCUNHO'
            WHEN 'PENDING_APPROVAL' THEN 'AGUARDANDO_APROVACAO'
            WHEN 'APPROVED' THEN 'APROVADA'
            WHEN 'REJECTED' THEN 'REJEITADA'
            WHEN 'AWAITING_CHECKIN' THEN 'AGUARDANDO_CHECKIN'
            WHEN 'IN_USE' THEN 'EM_USO'
            WHEN 'AWAITING_CHECKOUT' THEN 'AGUARDANDO_CHECKOUT'
            WHEN 'COMPLETED' THEN 'CONCLUIDA'
            WHEN 'CANCELLED' THEN 'CANCELADA'
            WHEN 'NO_SHOW' THEN 'NAO_COMPARECEU'
        END::status_reserva)
    """)
    op.execute("""
        ALTER TABLE reservation_status_history ALTER COLUMN status_anterior TYPE status_reserva
        USING (CASE status_anterior::text
            WHEN 'DRAFT' THEN 'RASCUNHO'
            WHEN 'PENDING_APPROVAL' THEN 'AGUARDANDO_APROVACAO'
            WHEN 'APPROVED' THEN 'APROVADA'
            WHEN 'REJECTED' THEN 'REJEITADA'
            WHEN 'AWAITING_CHECKIN' THEN 'AGUARDANDO_CHECKIN'
            WHEN 'IN_USE' THEN 'EM_USO'
            WHEN 'AWAITING_CHECKOUT' THEN 'AGUARDANDO_CHECKOUT'
            WHEN 'COMPLETED' THEN 'CONCLUIDA'
            WHEN 'CANCELLED' THEN 'CANCELADA'
            WHEN 'NO_SHOW' THEN 'NAO_COMPARECEU'
        END::status_reserva)
    """)
    op.execute("""
        ALTER TABLE reservation_status_history ALTER COLUMN status_novo TYPE status_reserva
        USING (CASE status_novo::text
            WHEN 'DRAFT' THEN 'RASCUNHO'
            WHEN 'PENDING_APPROVAL' THEN 'AGUARDANDO_APROVACAO'
            WHEN 'APPROVED' THEN 'APROVADA'
            WHEN 'REJECTED' THEN 'REJEITADA'
            WHEN 'AWAITING_CHECKIN' THEN 'AGUARDANDO_CHECKIN'
            WHEN 'IN_USE' THEN 'EM_USO'
            WHEN 'AWAITING_CHECKOUT' THEN 'AGUARDANDO_CHECKOUT'
            WHEN 'COMPLETED' THEN 'CONCLUIDA'
            WHEN 'CANCELLED' THEN 'CANCELADA'
            WHEN 'NO_SHOW' THEN 'NAO_COMPARECEU'
        END::status_reserva)
    """)
    op.execute("DROP TYPE reservation_status")

    # Step 5: Rename tables back
    op.rename_table('audit_records', 'registros_auditoria')
    op.rename_table('reservation_versions', 'versoes_reserva')
    op.rename_table('resource_loans', 'emprestimos_recurso')
    op.rename_table('incidents', 'incidentes')
    op.rename_table('appeals', 'apelos')
    op.rename_table('penalties', 'penalidades')
    op.rename_table('composite_reservation_items', 'reserva_composta_item')
    op.rename_table('composite_reservations', 'reserva_composta')
    op.rename_table('execution_buffers', 'buffer_execucao')
    op.rename_table('reservation_status_history', 'historico_status_reserva')
    op.rename_table('calendar_blocks', 'bloqueios_calendario')
    op.rename_table('approvals', 'aprovacoes')
    op.rename_table('reservation_support', 'suporte_reserva')
    op.rename_table('reservation_resources', 'recursos_reserva')
    op.rename_table('reservation_dependencies', 'dependencias_reserva')
    op.rename_table('reservations', 'reservas')
    op.rename_table('resource_maintenance', 'manutencao_recurso')
    op.rename_table('technician_schedule', 'escala_tecnico')
    op.rename_table('resource_availability', 'disponibilidade_recurso')
    op.rename_table('resources', 'recursos')
    op.rename_table('user_qualifications', 'qualificacoes_usuario')
    op.rename_table('qualifications', 'qualificacoes')
    op.rename_table('user_roles', 'usuario_papeis')
    op.rename_table('roles', 'papeis')
    op.rename_table('users', 'usuarios')
    op.rename_table('organizational_units', 'unidades_organizacionais')
    op.rename_table('environment_maintenance', 'manutencao_ambiente')
    op.rename_table('environment_requirements', 'requisitos_ambiente')
    op.rename_table('environment_restrictions', 'restricoes_ambiente')
    op.rename_table('reservation_policies', 'politica_reserva')
    op.rename_table('environments', 'ambientes')
    op.rename_table('locations', 'localizacoes')
