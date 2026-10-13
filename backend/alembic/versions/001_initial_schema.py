"""Initial SmartPark Schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-12 19:40:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='USER'),
        sa.Column('license_plate', sa.String(length=32), nullable=True),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('department', sa.String(length=128), nullable=True),
        sa.Column('preferred_zone', sa.String(length=16), nullable=True, server_default='A'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Parking Slots Table
    op.create_table(
        'parking_slots',
        sa.Column('id', sa.String(length=16), primary_key=True),
        sa.Column('zone', sa.String(length=16), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('is_accessible', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('distance_to_entrance_meters', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('is_occupied', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('is_maintenance', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('sensor_id', sa.String(length=64), nullable=False),
        sa.Column('sensor_gpio_pin', sa.Integer(), nullable=False),
        sa.Column('sensor_online', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('sensor_battery_percent', sa.Integer(), nullable=False, server_default='95'),
        sa.Column('sensor_signal_dbm', sa.Integer(), nullable=False, server_default='-55'),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Reservations Table
    op.create_table(
        'reservations',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('slot_id', sa.String(length=16), sa.ForeignKey('parking_slots.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_name', sa.String(length=128), nullable=False),
        sa.Column('user_email', sa.String(length=255), nullable=False),
        sa.Column('license_plate', sa.String(length=32), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='UPCOMING'),
        sa.Column('checked_in', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('checked_in_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checked_out_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('grace_period_minutes', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('qr_code_payload', sa.String(length=1024), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_reservations_slot_id', 'reservations', ['slot_id'])
    op.create_index('ix_reservations_user_id', 'reservations', ['user_id'])
    op.create_index('ix_reservations_status', 'reservations', ['status'])
    op.create_index('idx_reservations_slot_interval', 'reservations', ['slot_id', 'start_time', 'end_time', 'status'])
    op.create_index('idx_reservations_driver_interval', 'reservations', ['user_id', 'license_plate', 'start_time', 'end_time', 'status'])

    # Sensor Events Table
    op.create_table(
        'sensor_events',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('slot_id', sa.String(length=16), nullable=False),
        sa.Column('is_occupied', sa.Boolean(), nullable=False),
        sa.Column('raw_reading', sa.String(length=32), nullable=False, server_default='LOW'),
        sa.Column('sequence_number', sa.Integer(), nullable=True),
        sa.Column('device_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('server_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_processed', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('validation_result', sa.String(length=64), nullable=False, server_default='PROCESSED'),
    )
    op.create_index('ix_sensor_events_slot_id', 'sensor_events', ['slot_id'])

    # Audit Events Table
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False, server_default='INFO'),
        sa.Column('slot_id', sa.String(length=16), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=True),
        sa.Column('reservation_id', sa.String(length=64), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metadata_json', sa.Text(), nullable=True),
    )
    op.create_index('ix_audit_events_timestamp', 'audit_events', ['timestamp'])


def downgrade() -> None:
    op.drop_table('audit_events')
    op.drop_table('sensor_events')
    op.drop_table('reservations')
    op.drop_table('parking_slots')
    op.drop_table('users')
