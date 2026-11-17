# Modelo de Impacto Social e Sustentabilidade — PersonalAgro ("Zé Agro")

## Premissa Inviolável: Atendimento 100% Gratuito para o Produtor

O atendimento do **PersonalAgro (Zé Agro)** no WhatsApp é **100% gratuito e aberto** para agricultores familiares.

- **Sem cobrança no WhatsApp:** planos pagos/assinaturas ao produtor estão **desativados** no fluxo ativo ([`src/middlewares/subscription.js`](../src/middlewares/subscription.js)) e proibidos nas instruções dos agentes (`SALES_RULE` em [`src/services/ai.js`](../src/services/ai.js)).
- **Inclusão acima de monetização:** mais de 80% dos produtores brasileiros estão sem assistência técnica e quase 1 em cada 4 declara não saber ler ou escrever — cobrar ou impor barreiras digitais excluiria exatamente quem mais precisa para manter comida na mesa e o solo vivo.

*(Nota histórica: módulos legados de teste de cobrança permanecem isolados apenas para compatibilidade da suíte de regressão em `scripts/test_operacional.mjs`, sem exposição ao produtor no atendimento.)*

---

## Como o Projeto se Sustenta e Escala (B2G & Impacto Público)

1. **Infraestrutura de Custo Mínimo Hoje:**
   - Contas determinísticas locais em Node.js (`rotation.js`, `janela.js`, `market.js`) reduzem drasticamente o custo de inferência.
   - Rodízio multi-provedor em camadas gratuitas ([`src/services/provedores.js`](../src/services/provedores.js)) com failover automático garante operação resiliente por centavos ou custo zero no piloto.
   - Fontes climáticas e espaciais abertas (`NASA POWER`, `NASA GIBS`, `Open-Meteo`).

2. **Sustentabilidade Institucional (Parceria com o Poder Público):**
   - **Goiás (Base Validada em 6 Polos):** integração com políticas de assistência e compra pública como **SEAPA**, **EMATER-GO** e **PAA Goiás / Goiás Social**.
   - **Escala Nacional & Segurança Alimentar:** conexão da produção familiar às chamadas públicas do **PAA** e **PNAE** (onde por lei ao menos 30% dos recursos da merenda escolar devem comprar da agricultura familiar), além de **cooperativas** e **CEASAs**.
   - **Expansão Prioritária para Regiões Secas:** adaptação dos polos para o **Nordeste brasileiro** (onde apenas 7,4% das propriedades contam com assistência técnica — IBGE), via editais de inovação social, universidades e secretarias estaduais de agricultura — sempre preservando **R$ 0 para o Seu José**.
