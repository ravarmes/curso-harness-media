# Agenda do Consultório (API)

FastAPI + SQLite.

## Rodar

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

Documentação interativa (para testar na mão): http://127.0.0.1:8000/docs

## Testes

```powershell
.\.venv\Scripts\python -m pytest -q
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST/GET | `/pacientes`, `/pacientes/{id}` | cadastro (telefone em formato `+5511999998888`) |
| POST/GET | `/profissionais`, `/profissionais/{id}` | cadastro |
| POST | `/consultas` | agenda (`paciente_id`, `profissional_id`, `inicio`, `duracao_min`=30) |
| GET | `/consultas?profissional_id=&paciente_id=&status=` | lista |
| POST | `/consultas/{id}/cancelar` | cancela |
| POST | `/lembretes/enviar` | dispara o ciclo de lembretes agora (teste) |

## Regras

- Profissional não pode ter duas consultas agendadas que se sobreponham (409). Consultas encostadas (fim = início da próxima) são permitidas; canceladas liberam o horário.
- Cancelamento só até 24h antes do início (409 depois disso).
- `inicio` sem fuso é interpretado como horário de Brasília (UTC-3); com fuso, respeita o informado. O banco guarda UTC.

## Lembrete por WhatsApp

Uma tarefa em segundo plano roda a cada 60 s e envia o lembrete das consultas agendadas que começam em até 24h, uma única vez por consulta. Consultas marcadas já dentro dessa janela recebem o lembrete no ciclo seguinte.

Sem credenciais, a mensagem é só **registrada no log** (simulado). Para enviar de verdade via Twilio, defina `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_WHATSAPP_FROM`. Fora da janela de 24h de conversa do WhatsApp, o Twilio exige template aprovado; ajuste `app/whatsapp.py` se for o caso.

O banco é `consultorio.db` (ou o caminho em `CONSULTORIO_DB`).
