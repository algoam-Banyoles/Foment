from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.sqlite import BLOB

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('parameters',
        sa.Column('key', sa.String(), primary_key=True),
        sa.Column('value', sa.String()),
        sa.Column('description', sa.String()),
        sa.Column('updated_at', sa.DateTime()))
    op.create_table('players',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('actiu','pre-inactiu','inactiu', name='playerstatus'), nullable=True),
        sa.Column('date_joined', sa.DateTime()),
        sa.Column('date_left', sa.DateTime()),
        sa.Column('last_match_at', sa.DateTime()),
        sa.Column('last_challenge_started_at', sa.DateTime()),
        sa.Column('user_email', sa.String()))
    op.create_table('ranking_active',
        sa.Column('position', sa.Integer(), primary_key=True),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id'), unique=True))
    op.create_table('waitlist',
        sa.Column('order', sa.Integer(), primary_key=True),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id'), unique=True),
        sa.Column('date_joined', sa.DateTime()))
    op.create_table('challenges',
        sa.Column('id', BLOB(), primary_key=True),
        sa.Column('type', sa.Enum('normal','acces', name='challengetype')), 
        sa.Column('challenger_id', sa.Integer(), sa.ForeignKey('players.id')),
        sa.Column('challenged_id', sa.Integer(), sa.ForeignKey('players.id')),
        sa.Column('state', sa.Enum('proposat','acceptat','programat','jugat','no_disputat','sancionat','tancat', name='challengestate')),
        sa.Column('proposal_1', sa.DateTime()),
        sa.Column('proposal_2', sa.DateTime()),
        sa.Column('proposal_3', sa.DateTime()),
        sa.Column('accepted_at', sa.DateTime()),
        sa.Column('deadline_to_play', sa.DateTime()),
        sa.Column('scheduled_at', sa.DateTime()),
        sa.Column('result_winner_is_challenger', sa.Boolean()),
        sa.Column('result_reason', sa.Enum('RESULTAT','INCOMPAREIXENCA','REFUS','SENSE_ACORD','SANCIO', name='resultreason')),
        sa.Column('notes', sa.String()),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('created_by', sa.String()))
    op.create_table('matches',
        sa.Column('id', BLOB(), primary_key=True),
        sa.Column('challenge_id', BLOB(), sa.ForeignKey('challenges.id')),
        sa.Column('date', sa.DateTime()),
        sa.Column('home_id', sa.Integer(), sa.ForeignKey('players.id')),
        sa.Column('away_id', sa.Integer(), sa.ForeignKey('players.id')),
        sa.Column('innings', sa.Integer()),
        sa.Column('home_caram', sa.Integer()),
        sa.Column('away_caram', sa.Integer()),
        sa.Column('tiebreak_used', sa.Boolean()),
        sa.Column('tiebreak_detail', sa.String()),
        sa.Column('validated', sa.Boolean()),
        sa.Column('validated_by', sa.String()),
        sa.Column('validated_at', sa.DateTime()))
    op.create_table('history',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.id')),
        sa.Column('description', sa.String()),
        sa.Column('created_at', sa.DateTime()))

def downgrade():
    op.drop_table('history')
    op.drop_table('matches')
    op.drop_table('challenges')
    op.drop_table('waitlist')
    op.drop_table('ranking_active')
    op.drop_table('players')
    op.drop_table('parameters')
