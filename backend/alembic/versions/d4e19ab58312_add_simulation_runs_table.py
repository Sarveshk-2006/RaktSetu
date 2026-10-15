"""add_simulation_runs_table

Revision ID: d4e19ab58312
Revises: c1e12ca38eb4
Create Date: 2026-10-16 00:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e19ab58312'
down_revision: Union[str, Sequence[str], None] = 'c1e12ca38eb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'simulation_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('simulation_id', sa.String(length=32), nullable=False),
        sa.Column('scenario_id', sa.String(length=32), nullable=False),
        sa.Column('scenario_name', sa.String(length=128), nullable=False),
        sa.Column('parameters', sa.JSON(), nullable=False),
        sa.Column('baseline_metrics', sa.JSON(), nullable=False),
        sa.Column('simulated_metrics', sa.JSON(), nullable=False),
        sa.Column('capacity_difference_percent', sa.Float(), nullable=False),
        sa.Column('affected_blood_groups', sa.JSON(), nullable=False),
        sa.Column('affected_zones', sa.JSON(), nullable=False),
        sa.Column('bottlenecks', sa.JSON(), nullable=False),
        sa.Column('interventions', sa.JSON(), nullable=False),
        sa.Column('executed_at', sa.DateTime(), nullable=False),
        sa.Column('executed_by', sa.String(length=128), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_simulation_runs_scenario_id'), 'simulation_runs', ['scenario_id'], unique=False)
    op.create_index(op.f('ix_simulation_runs_simulation_id'), 'simulation_runs', ['simulation_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_simulation_runs_simulation_id'), table_name='simulation_runs')
    op.drop_index(op.f('ix_simulation_runs_scenario_id'), table_name='simulation_runs')
    op.drop_table('simulation_runs')
