import os
import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT
);
CREATE TABLE IF NOT EXISTS profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expediente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
    dia_semana INTEGER NOT NULL,   -- 0 = segunda ... 6 = domingo
    inicio_min INTEGER NOT NULL,   -- minutos desde 00:00, horário de Brasília
    fim_min INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expediente_prof ON expediente(profissional_id, dia_semana);
CREATE TABLE IF NOT EXISTS consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
    profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
    inicio TEXT NOT NULL,          -- UTC, ISO 8601
    fim TEXT NOT NULL,             -- UTC, ISO 8601
    status TEXT NOT NULL DEFAULT 'agendada',  -- agendada | cancelada
    lembrete_enviado_em TEXT
);
CREATE INDEX IF NOT EXISTS idx_consultas_prof ON consultas(profissional_id, status, inicio);
"""


def connect(path: str | None = None) -> sqlite3.Connection:
    path = path or os.environ.get("CONSULTORIO_DB", "consultorio.db")
    conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    return conn
