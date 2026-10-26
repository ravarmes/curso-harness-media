# Progresso

## 2026-10-25 — iniciar-projeto
- Feito: lista para o projeto existente (fase 2); lista com 4 funcionalidades (F1 remarcar, F2 relatório de ocupação, F3 lista de espera, F4 aviso de vaga).
- Verificação: passando (npm run verify).
- Próximo passo: F1, depois de o usuário aprovar a lista.

## 2026-10-25 — F1 remarcar consulta
- Feito: especificação `docs/specs/remarcar-consulta.md` (aprovada); `POST /consultas/:id/remarcacao` em `agenda/remarcar-consulta`; repositório com `remarcar` e `ignorar` nas checagens de ocupação; checagem de expediente/ocupação extraída para `agenda/disponibilidade.ts` e reaproveitada por `agendar-consulta`.
- Verificação: passando (npm run verify, 123 testes). Revisor: aprovado. Verificador: aprovado; os limites de 24 h não são verificáveis pela API (relógio real) e ficam cobertos pelos testes unitários.
- Melhorias sugeridas pelo revisor, não feitas: teste HTTP da rota, `paciente_id` inválido (0/negativo/fracionário) no teste de 400, limite exato do "novo horário já passou".
- Próximo passo: F2, relatório de ocupação por profissional.
