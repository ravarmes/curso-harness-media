"""Envio de WhatsApp. Sem credenciais configuradas, apenas registra no log."""
import logging
import os

import httpx

log = logging.getLogger("consultorio.whatsapp")


class LogSender:
    def __init__(self):
        self.enviadas: list[tuple[str, str]] = []

    def enviar(self, telefone: str, mensagem: str) -> None:
        self.enviadas.append((telefone, mensagem))
        log.info("[WhatsApp simulado] para %s: %s", telefone, mensagem)


class TwilioSender:
    """Usa a API do Twilio. Requer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM."""

    def __init__(self, sid: str, token: str, origem: str):
        self.sid, self.token, self.origem = sid, token, origem

    def enviar(self, telefone: str, mensagem: str) -> None:
        r = httpx.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{self.sid}/Messages.json",
            auth=(self.sid, self.token),
            data={"From": f"whatsapp:{self.origem}", "To": f"whatsapp:{telefone}", "Body": mensagem},
            timeout=15,
        )
        r.raise_for_status()


def sender_from_env():
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    origem = os.environ.get("TWILIO_WHATSAPP_FROM")
    if sid and token and origem:
        return TwilioSender(sid, token, origem)
    return LogSender()
