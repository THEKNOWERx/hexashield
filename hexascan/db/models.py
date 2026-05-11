from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class Host(Base):
    __tablename__ = "hosts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    ip_address: Mapped[str] = mapped_column(unique=True, index=True)
    hostname: Mapped[Optional[str]]
    mac_address: Mapped[Optional[str]]
    os_hint: Mapped[Optional[str]]
    last_seen: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    total_scans: Mapped[int] = mapped_column(default=0)
    
    scans: Mapped[List["Scan"]] = relationship(back_populates="host")

class Scan(Base):
    __tablename__ = "scans"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("hosts.id"))
    target_ip: Mapped[str] = mapped_column(index=True)
    target_hostname: Mapped[Optional[str]]
    scan_type: Mapped[str]  # quick, standard, full, custom
    status: Mapped[str]     # running, completed, failed
    started_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]]
    
    host: Mapped["Host"] = relationship(back_populates="scans")
    ports: Mapped[List["PortResult"]] = relationship(back_populates="scan", cascade="all, delete-orphan")

class PortResult(Base):
    __tablename__ = "ports"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"))
    port_number: Mapped[int]
    protocol: Mapped[str]  # tcp, udp
    state: Mapped[str]     # open, closed, filtered
    service_name: Mapped[Optional[str]]
    service_version: Mapped[Optional[str]]
    banner: Mapped[Optional[str]]
    response_time_ms: Mapped[Optional[float]]
    risk_level: Mapped[str] = mapped_column(default="Informational")  # Informational, Low, Medium, High, Critical
    confidence: Mapped[str] = mapped_column(default="Low")  # Low, Medium, High
    validated_by: Mapped[Optional[str]] # Comma separated list of tools (e.g. nmap,banner,http)
    
    scan: Mapped["Scan"] = relationship(back_populates="ports")
