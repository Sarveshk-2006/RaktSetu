"""initial_canonical_schema

Revision ID: c1e12ca38eb4
Revises: 
Create Date: 2026-10-15 23:12:56.592553

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1e12ca38eb4'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: ensure initial canonical tables exist."""
    from app.models.db_models import (
        Organisation, Donor, BloodRequirement, Incident,
        ResponseWave, ContactAttempt, DonorResponse,
        FulfilmentRecord, AuditEvent, User
    )
    bind = op.get_bind()
    tables = [
        Organisation.__table__,
        Donor.__table__,
        BloodRequirement.__table__,
        Incident.__table__,
        ResponseWave.__table__,
        ContactAttempt.__table__,
        DonorResponse.__table__,
        FulfilmentRecord.__table__,
        AuditEvent.__table__,
        User.__table__,
    ]
    for table in tables:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    """Downgrade schema."""
    from app.models.db_models import (
        Organisation, Donor, BloodRequirement, Incident,
        ResponseWave, ContactAttempt, DonorResponse,
        FulfilmentRecord, AuditEvent, User
    )
    bind = op.get_bind()
    tables = [
        User.__table__,
        AuditEvent.__table__,
        FulfilmentRecord.__table__,
        DonorResponse.__table__,
        ContactAttempt.__table__,
        ResponseWave.__table__,
        Incident.__table__,
        BloodRequirement.__table__,
        Donor.__table__,
        Organisation.__table__,
    ]
    for table in tables:
        table.drop(bind=bind, checkfirst=True)
