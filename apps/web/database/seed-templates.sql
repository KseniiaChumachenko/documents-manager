-- Seed document templates based on reference files:
--   .claude/references/Довіреність № 19 від 30,06,2023.xls
--   .claude/references/РН-0000003 від 26,02,2025.xls
--   .claude/references/СФ-0000305 від 26,12,2024.xls

INSERT OR IGNORE INTO document_template (id, name, type, schema_json, created_at, updated_at)
VALUES
(1, 'Рахунок-фактура (стандартний)', 'invoices', '{
  "fields": [
    {
      "key": "number",
      "label": "№ рахунку-фактури",
      "type": "text",
      "required": true
    },
    {
      "key": "date",
      "label": "Дата",
      "type": "date",
      "required": true
    },
    {
      "key": "company_id",
      "label": "Одержувач",
      "type": "company_ref",
      "required": true
    },
    {
      "key": "contract_number",
      "label": "№ договору",
      "type": "text"
    },
    {
      "key": "contract_date",
      "label": "Дата договору",
      "type": "date"
    },
    {
      "key": "valid_until",
      "label": "Рахунок дійсний до",
      "type": "date"
    }
  ],
  "line_items": {
    "source": "items",
    "columns": [
      "name",
      "unit",
      "quantity",
      "price_override",
      "total"
    ],
    "allow_price_override": true
  },
  "totals": [
    {
      "label": "Сума без ПДВ",
      "formula": "sum(line_items.total)"
    },
    {
      "label": "ПДВ 20%",
      "formula": "sum(line_items.total) * 0.2"
    },
    {
      "label": "Разом з ПДВ",
      "formula": "sum(line_items.total) * 1.2"
    }
  ],
  "layout": {
    "cols": [
      5,
      38,
      16,
      10,
      8,
      12,
      14,
      14
    ],
    "blocks": [
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Постачальник"
          },
          {
            "col": 2,
            "text": "{{supplier.name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "ЄДРПОУ {{supplier.egrpou}}, тел. {{supplier.phone}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "Р/р {{supplier.iban}} в  {{supplier.bankName}} МФО {{supplier.mfo}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "ІПН {{supplier.inn}}, номер свідоцтва {{supplier.vatCertificate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "{{supplier.taxNote}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "Адреса {{supplier.address}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Одержувач"
          },
          {
            "col": 2,
            "text": "{{counterparty.name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "тел. {{counterparty.phone}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Платник"
          },
          {
            "col": 2,
            "text": "той самий"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Замовлення"
          },
          {
            "col": 2,
            "text": "{{field.invoice_ref}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Умова продажу:"
          },
          {
            "col": 2,
            "text": "{{field.sales_terms}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "Рахунок-фактура № {{field.number}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "від {{field.date | longDate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "lineItems",
        "header": [
          {
            "col": 0,
            "text": "№"
          },
          {
            "col": 1,
            "text": "Назва"
          },
          {
            "col": 4,
            "text": "Од."
          },
          {
            "col": 5,
            "text": "Кількість"
          },
          {
            "col": 6,
            "text": "Ціна без ПДВ"
          },
          {
            "col": 7,
            "text": "Сума без ПДВ"
          }
        ],
        "row": [
          {
            "col": 0,
            "text": "{{index}}"
          },
          {
            "col": 1,
            "text": "{{line.name}}"
          },
          {
            "col": 4,
            "text": "{{line.unit}}"
          },
          {
            "col": 5,
            "text": "{{line.quantity}}"
          },
          {
            "col": 6,
            "text": "{{line.price | money}}"
          },
          {
            "col": 7,
            "text": "{{line.total | money}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 6,
            "text": "Знижка:"
          },
          {
            "col": 7,
            "text": "{{totals.discount | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 6,
            "text": "Разом без ПДВ:"
          },
          {
            "col": 7,
            "text": "{{totals.subtotal | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 6,
            "text": "ПДВ:"
          },
          {
            "col": 7,
            "text": "{{totals.vat | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 6,
            "text": "Всього з ПДВ:"
          },
          {
            "col": 7,
            "text": "{{totals.total | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "novat",
        "cells": [
          {
            "col": 6,
            "text": "Всього:"
          },
          {
            "col": 7,
            "text": "{{totals.total | money}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "Всього на суму:"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "{{totals.total | hryvniaWords}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 0,
            "text": "ПДВ:       {{totals.vat | money}} грн."
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 7,
            "text": "{{field.valid_until_note}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Виписав(ла):"
          },
          {
            "col": 5,
            "text": "Отримав(ла)"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "{{supplier.signatoryName}}"
          }
        ]
      }
    ]
  }
}', datetime('now'), datetime('now')),

(2, 'Видаткова накладна (стандартна)', 'bills', '{
  "fields": [
    {
      "key": "number",
      "label": "№ видаткової накладної",
      "type": "text",
      "required": true
    },
    {
      "key": "date",
      "label": "Дата",
      "type": "date",
      "required": true
    },
    {
      "key": "company_id",
      "label": "Одержувач",
      "type": "company_ref",
      "required": true
    },
    {
      "key": "invoice_ref",
      "label": "Замовлення (рахунок-фактура)",
      "type": "text"
    },
    {
      "key": "sales_terms",
      "label": "Умова продажу",
      "type": "text"
    }
  ],
  "line_items": {
    "source": "items",
    "columns": [
      "name",
      "unit",
      "quantity",
      "price_override",
      "total"
    ],
    "allow_price_override": true
  },
  "totals": [
    {
      "label": "Сума без ПДВ",
      "formula": "sum(line_items.total)"
    },
    {
      "label": "ПДВ 20%",
      "formula": "sum(line_items.total) * 0.2"
    },
    {
      "label": "Разом з ПДВ",
      "formula": "sum(line_items.total) * 1.2"
    }
  ],
  "layout": {
    "cols": [
      5,
      38,
      16,
      10,
      8,
      12,
      14,
      14
    ],
    "blocks": [
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Постачальник"
          },
          {
            "col": 2,
            "text": "{{supplier.name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "ЄДРПОУ {{supplier.egrpou}}, тел. {{supplier.phone}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "Р/р {{supplier.iban}} в  {{supplier.bankName}} МФО {{supplier.mfo}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "ІПН {{supplier.inn}}, номер свідоцтва {{supplier.vatCertificate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "{{supplier.taxNote}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "Адреса {{supplier.address}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Одержувач"
          },
          {
            "col": 2,
            "text": "{{counterparty.name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "тел. {{counterparty.phone}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Платник"
          },
          {
            "col": 2,
            "text": "той самий"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Замовлення"
          },
          {
            "col": 2,
            "text": "{{field.invoice_ref}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Умова продажу:"
          },
          {
            "col": 2,
            "text": "{{field.sales_terms}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "Видаткова накладна № {{field.number}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "від {{field.date | longDate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "lineItems",
        "header": [
          {
            "col": 0,
            "text": "№"
          },
          {
            "col": 1,
            "text": "Товар"
          },
          {
            "col": 4,
            "text": "Од."
          },
          {
            "col": 5,
            "text": "Кількість"
          },
          {
            "col": 6,
            "text": "Ціна без ПДВ"
          },
          {
            "col": 7,
            "text": "Сума без ПДВ"
          }
        ],
        "row": [
          {
            "col": 0,
            "text": "{{index}}"
          },
          {
            "col": 1,
            "text": "{{line.name}}"
          },
          {
            "col": 4,
            "text": "{{line.unit}}"
          },
          {
            "col": 5,
            "text": "{{line.quantity}}"
          },
          {
            "col": 6,
            "text": "{{line.price | money}}"
          },
          {
            "col": 7,
            "text": "{{line.total | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 6,
            "text": "Разом без ПДВ:"
          },
          {
            "col": 7,
            "text": "{{totals.subtotal | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 6,
            "text": "ПДВ:"
          },
          {
            "col": 7,
            "text": "{{totals.vat | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 6,
            "text": "Всього з ПДВ:"
          },
          {
            "col": 7,
            "text": "{{totals.total | money}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "novat",
        "cells": [
          {
            "col": 6,
            "text": "Всього:"
          },
          {
            "col": 7,
            "text": "{{totals.total | money}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "Всього на суму:"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "{{totals.total | hryvniaWords}}"
          }
        ]
      },
      {
        "type": "row",
        "when": "vat",
        "cells": [
          {
            "col": 0,
            "text": "ПДВ:       {{totals.vat | money}} грн."
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 7,
            "text": "{{field.valid_until_note}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Відвантажив(ла)"
          },
          {
            "col": 5,
            "text": "Отримав(ла)"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "{{supplier.signatoryName}}"
          }
        ]
      }
    ]
  }
}', datetime('now'), datetime('now')),

(3, 'Довіреність (типова форма М-2)', 'poas', '{
  "fields": [
    {
      "key": "number",
      "label": "№ довіреності",
      "type": "text",
      "required": true
    },
    {
      "key": "date",
      "label": "Дата видачі",
      "type": "date",
      "required": true
    },
    {
      "key": "valid_until",
      "label": "Дійсна до",
      "type": "date",
      "required": true
    },
    {
      "key": "company_id",
      "label": "Постачальник (від кого отримати)",
      "type": "company_ref",
      "required": true
    },
    {
      "key": "invoice_ref",
      "label": "За рахунком №",
      "type": "text"
    },
    {
      "key": "recipient_name",
      "label": "ПІБ довіреної особи",
      "type": "text",
      "required": true
    },
    {
      "key": "recipient_position",
      "label": "Посада довіреної особи",
      "type": "text"
    },
    {
      "key": "recipient_passport_series",
      "label": "Серія паспорту",
      "type": "text"
    },
    {
      "key": "recipient_passport_number",
      "label": "№ паспорту",
      "type": "text"
    },
    {
      "key": "recipient_passport_date",
      "label": "Дата видачі паспорту",
      "type": "date"
    },
    {
      "key": "recipient_passport_issued_by",
      "label": "Ким виданий паспорт",
      "type": "text"
    }
  ],
  "line_items": {
    "source": "items",
    "columns": [
      "name",
      "unit",
      "quantity"
    ],
    "allow_price_override": false
  },
  "totals": [],
  "layout": {
    "cols": [
      5,
      38,
      16,
      16,
      12,
      12,
      6,
      14,
      18,
      18
    ],
    "blocks": [
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "{{supplier.name}}"
          },
          {
            "col": 9,
            "text": "Типова форма N М-2"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "{{supplier.address}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "підприємство-одержувач і його адреса"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Ідентифікаційний код ЄДРПОУ"
          },
          {
            "col": 5,
            "text": "{{supplier.egrpou}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "{{supplier.name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "{{supplier.address}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "підприємство-платник і його адреса"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "рахунок"
          },
          {
            "col": 2,
            "text": "{{supplier.iban}}"
          },
          {
            "col": 6,
            "text": "МФО"
          },
          {
            "col": 7,
            "text": "{{supplier.mfo}}"
          },
          {
            "col": 9,
            "text": "Довіреність дійсна до"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "{{supplier.bankName}}"
          },
          {
            "col": 9,
            "text": "{{field.valid_until | longDate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 4,
            "text": "ДОВІРЕНІСТЬ N"
          },
          {
            "col": 7,
            "text": "{{field.number}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 4,
            "text": "Дата видачі"
          },
          {
            "col": 6,
            "text": "{{field.date | longDate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Видано"
          },
          {
            "col": 2,
            "text": "{{field.recipient_name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 2,
            "text": "(посада, прізвище, ім''я, по батькові)"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Документ, що засвідчує особу"
          },
          {
            "col": 7,
            "text": "паспорт"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "серія"
          },
          {
            "col": 2,
            "text": "{{field.recipient_passport_series}}"
          },
          {
            "col": 3,
            "text": "N"
          },
          {
            "col": 4,
            "text": "{{field.recipient_passport_number}}"
          },
          {
            "col": 6,
            "text": "від"
          },
          {
            "col": 7,
            "text": "{{field.recipient_passport_date | longDate}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Виданий"
          },
          {
            "col": 3,
            "text": "{{field.recipient_passport_issued_by}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "На отримання від"
          },
          {
            "col": 3,
            "text": "{{counterparty.name}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "цінностей за"
          },
          {
            "col": 3,
            "text": "рахунком № {{field.invoice_ref}}",
            "omitIfEmpty": true
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 0,
            "text": "Перелік цінностей, які належить отримати:"
          }
        ]
      },
      {
        "type": "lineItems",
        "header": [
          {
            "col": 0,
            "text": "NN п/п"
          },
          {
            "col": 1,
            "text": "Найменування цінностей"
          },
          {
            "col": 7,
            "text": "Одиниця виміру"
          },
          {
            "col": 8,
            "text": "Кількість (прописом)"
          }
        ],
        "row": [
          {
            "col": 0,
            "text": "{{index}}"
          },
          {
            "col": 1,
            "text": "{{line.name}}"
          },
          {
            "col": 7,
            "text": "{{line.unit}}"
          },
          {
            "col": 8,
            "text": "{{line.quantity | intWords}}"
          }
        ]
      },
      {
        "type": "row",
        "cells": []
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Підпис"
          },
          {
            "col": 8,
            "text": "засвідчую"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Керівник підприємства"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Головний бухгалтер"
          }
        ]
      },
      {
        "type": "row",
        "cells": [
          {
            "col": 1,
            "text": "Місце печатки"
          }
        ]
      }
    ]
  }
}', datetime('now'), datetime('now'));
