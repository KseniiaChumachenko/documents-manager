# 01 — Legal Entity Types & State Registries

*Current as of June 2026.*

## ЮО vs ФОП

- **Юридична особа (ЮО / legal entity)** — an organisation registered per law, with separate property and its own civil rights/obligations (ЦКУ ст. 80). Founders are generally **not** liable for its debts beyond their contribution — limited liability (ЦКУ ст. 96). Requires founding documents (статут) and, for most forms, statutory capital.
- **ФОП (фізична особа-підприємець / individual entrepreneur)** — a natural person who acquired business-entity status by state registration (ЦКУ ст. 50–54). **Not a separate legal entity** — the same natural person, liable for business obligations with **all personal property** (ЦКУ ст. 52). No founding documents, no statutory capital.
- Umbrella term for both in commercial law: **суб'єкт господарювання** (ГКУ ст. 55).

Implications for documents/accounting:
- ЮО is identified on documents by **ЄДРПОУ**; ФОП by **РНОКПП**.
- ФОП typically uses the simplified system with lighter reporting; ЮО has fuller accounting + financial-statement obligations.

## Identifier codes — these are constantly confused

| Code | Length | Whom for | Register / act |
|---|---|---|---|
| **ЄДРПОУ** | **8 digits** | Legal entities (+ separated units) | ЄДРПОУ register (Держстат); referenced throughout Закон № 755-IV |
| **РНОКПП** (legacy name **ІПН** фізособи) | **10 digits** | Natural persons, incl. ФОП | ДРФО — Держ. реєстр фізичних осіб платників податків |
| **ІПН платника ПДВ** (VAT number) | **12 digits** | VAT payers (ЮО or ФОП) | Реєстр платників ПДВ, ПКУ ст. 183 |

Key facts:
- A **ФОП uses their personal 10-digit РНОКПП** — no separate 8-digit code is issued. A ФОП never has a ЄДРПОУ.
- The **12-digit ІПН платника ПДВ** is assigned only on VAT registration. For a legal entity: digits 1–7 = first 7 of ЄДРПОУ, 8–9 = oblast, 10–11 = district, 12 = check digit. For a natural person/ФОП registered from 09.03.2020: digits 1–10 = РНОКПП, 11–12 = check digits.
- Since **01.01.2023** the term **ІПН** is formally reserved for the VAT number; **РНОКПП** is the individual number. Don't reuse "ІПН" ambiguously in schema/UI.

> ⚠ **Validation rule for software:** an entity record should hold *either* an 8-digit ЄДРПОУ (ЮО) *or* a 10-digit РНОКПП (ФОП), never both; and a separate optional 12-digit VAT number if the entity is a ПДВ payer.

## КВЕД (Класифікація видів економічної діяльності)

- **In force through 2026: КВЕД-2010 = ДК 009:2010** (наказ Держспоживстандарту від 11.10.2010 № 457).
- **Format:** hierarchical — section (letter) → **division.group.class.subclass**, e.g. class **"01.11"** (numeric, dot-separated). Codes define declared activities and drive tax/licensing treatment.
- **Successor: NACE 2.1-UA** (наказ Держстату від 28.10.2025 № 191) takes effect **from 1 January 2027**, replacing ДК 009:2010. 2026 is the transition year; correspondence tables published 21.05.2026. ⚠ unverified whether the numeric code-format string changes structurally under NACE 2.1-UA — plan for a possible reclassification mapping in early 2027.

## ЄДР registry & data sources

- **ЄДР** = Єдиний державний реєстр юридичних осіб, фізичних осіб-підприємців та громадських формувань, governed by **Закон № 755-IV** (current redaction 24.04.2026). It is the authoritative public register of entity data (ст. 7).
- **Data held (ст. 9):** for a **ЮО** — full/short name, organisational-legal form, ЄДРПОУ, legal address, КВЕД activities, governing bodies/signatories (director), founders/beneficial owners, statutory capital, status; for a **ФОП** — ПІБ, РНОКПП, address, КВЕД activities, status. ⚠ field list summarised, not quoted verbatim.
- **Official data sources:** the open-data portal **data.gov.ua** (publishes the ЄДР dataset), the **Дія / diia.data.gov.ua** business section, and Мінʼюст extract (витяг) service.
- **Third-party aggregators** (resell/enrich official ЄДР data, NOT official registrars): **Opendatabot**, **YouControl**, **adm.tools**. The repo's company lookup uses **adm.tools** (`https://adm.tools/action/gov/api/?egrpou=<code>`, Windows-1251 XML) — treat it as a third-party convenience layer over official ЄДР data, not an authoritative registrar.

## Mandatory legal-entity attributes on accounting documents

A ЮО counterparty on an invoice/act/накладна must carry: **full name** (per ЄДР), **код ЄДРПОУ** (8), **legal address**, **director/authorised signatory**, and **ІПН платника ПДВ** (12) if VAT-registered (mandatory on податкова накладна, ПКУ ст. 201). A **ФОП** counterparty carries **ПІБ + РНОКПП** (10) instead of name + ЄДРПОУ, plus the 12-digit VAT number if applicable.

## Sources

- ЦКУ № 435-IV ст. 50–54, 80, 96 — https://zakon.rada.gov.ua/laws/show/435-15
- ГКУ № 436-IV ст. 55 — https://zakon.rada.gov.ua/laws/show/436-15
- ПКУ ст. 183, п. 183.18 (12-digit ІПН ПДВ), ст. 201 — https://zakon.rada.gov.ua/laws/show/2755-17
- КВЕД ДК 009:2010, наказ № 457 — https://zakon.rada.gov.ua/rada/show/vb457609-10
- NACE 2.1-UA, наказ Держстату № 191 (eff. 01.01.2027) — https://news.dtkt.ua/accounting/reposts/111697
- Закон № 755-IV ст. 7, 9 — https://zakon.rada.gov.ua/laws/show/755-15
- Open data: https://data.gov.ua/ , https://diia.data.gov.ua/value/business
- Identifier explainers: https://youcontrol.com.ua/topics/shcho-take-rnokpp/ , https://landlord.ua/news/novyny-partneriv/identyfikaczijni-kody-v-ukrayini-yedrpou-ta-ipn-rnokpp/

**⚠ unverified:** verbatim field list of 755-IV ст. 9; whether NACE 2.1-UA changes the numeric code format.
