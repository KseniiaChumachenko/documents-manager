-- Seed document templates based on reference files:
--   .claude/references/Довіреність № 19 від 30,06,2023.xls
--   .claude/references/РН-0000003 від 26,02,2025.xls
--   .claude/references/СФ-0000305 від 26,12,2024.xls

INSERT OR IGNORE INTO document_template (id, name, type, schema_json, created_at, updated_at)
VALUES
(1, 'Рахунок-фактура (стандартний)', 'invoices', '{
  "fields": [
    { "key": "number", "label": "№ рахунку-фактури", "type": "text", "required": true },
    { "key": "date", "label": "Дата", "type": "date", "required": true },
    { "key": "company_id", "label": "Одержувач", "type": "company_ref", "required": true },
    { "key": "contract_number", "label": "№ договору", "type": "text" },
    { "key": "contract_date", "label": "Дата договору", "type": "date" },
    { "key": "valid_until", "label": "Рахунок дійсний до", "type": "date" }
  ],
  "line_items": {
    "source": "items",
    "columns": ["name", "unit", "quantity", "price_override", "total"],
    "allow_price_override": true
  },
  "totals": [
    { "label": "Сума без ПДВ", "formula": "sum(line_items.total)" },
    { "label": "ПДВ 20%", "formula": "sum(line_items.total) * 0.2" },
    { "label": "Разом з ПДВ", "formula": "sum(line_items.total) * 1.2" }
  ]
}', datetime('now'), datetime('now')),

(2, 'Видаткова накладна (стандартна)', 'bills', '{
  "fields": [
    { "key": "number", "label": "№ видаткової накладної", "type": "text", "required": true },
    { "key": "date", "label": "Дата", "type": "date", "required": true },
    { "key": "company_id", "label": "Одержувач", "type": "company_ref", "required": true },
    { "key": "invoice_ref", "label": "Замовлення (рахунок-фактура)", "type": "text" },
    { "key": "sales_terms", "label": "Умова продажу", "type": "text" }
  ],
  "line_items": {
    "source": "items",
    "columns": ["name", "unit", "quantity", "price_override", "total"],
    "allow_price_override": true
  },
  "totals": [
    { "label": "Сума без ПДВ", "formula": "sum(line_items.total)" },
    { "label": "ПДВ 20%", "formula": "sum(line_items.total) * 0.2" },
    { "label": "Разом з ПДВ", "formula": "sum(line_items.total) * 1.2" }
  ]
}', datetime('now'), datetime('now')),

(3, 'Довіреність (типова форма М-2)', 'poas', '{
  "fields": [
    { "key": "number", "label": "№ довіреності", "type": "text", "required": true },
    { "key": "date", "label": "Дата видачі", "type": "date", "required": true },
    { "key": "valid_until", "label": "Дійсна до", "type": "date", "required": true },
    { "key": "company_id", "label": "Постачальник (від кого отримати)", "type": "company_ref", "required": true },
    { "key": "invoice_ref", "label": "За рахунком №", "type": "text" },
    { "key": "recipient_name", "label": "ПІБ довіреної особи", "type": "text", "required": true },
    { "key": "recipient_position", "label": "Посада довіреної особи", "type": "text" },
    { "key": "recipient_passport_series", "label": "Серія паспорту", "type": "text" },
    { "key": "recipient_passport_number", "label": "№ паспорту", "type": "text" },
    { "key": "recipient_passport_date", "label": "Дата видачі паспорту", "type": "date" },
    { "key": "recipient_passport_issued_by", "label": "Ким виданий паспорт", "type": "text" }
  ],
  "line_items": {
    "source": "items",
    "columns": ["name", "unit", "quantity"],
    "allow_price_override": false
  },
  "totals": []
}', datetime('now'), datetime('now'));
