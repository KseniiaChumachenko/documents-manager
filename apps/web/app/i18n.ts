import type { Location } from 'react-router-dom';

export const i18n = {
  '/': {
    title: 'Головна',
  },
  '/documents': {
    title: 'Документи',
  },
  '/documents/settings': {
    title: 'Налаштування',
  },
  '/documents/poas': {
    title: 'Довіренності',
  },
  '/documents/bills': {
    title: 'Видаткові накладні',
  },
  '/documents/invoices': {
    title: 'Рахунки фактури',
  },
  documents: {
    typeLabels: {
      invoices: 'Рахунки фактури',
      bills: 'Видаткові накладні',
      poas: 'Довіренності',
    } as Record<string, string>,
    actions: {
      newDocument: 'Новий документ',
      newTemplate: 'Новий шаблон',
      export: {
        xlsx: 'Завантажити XLSX',
        pdf: 'Завантажити PDF',
      },
      save: 'Зберегти',
      delete: 'Видалити',
      uploadStamp: 'Завантажити печатку',
      settings: 'Налаштування шаблонів',
    },
    table: {
      headers: {
        number: '№',
        date: 'Дата',
        company: 'Контрагент',
        createdBy: 'Автор',
        exportStatus: 'Експорт',
        createdAt: 'Створено',
      },
    },
    templates: {
      title: 'Шаблони',
      table: {
        headers: {
          name: 'Назва',
          type: 'Тип',
          createdAt: 'Створено',
          updatedAt: 'Оновлено',
        },
      },
      form: {
        name: 'Назва шаблону',
        type: 'Тип документу',
        schema: 'Схема полів',
        stamp: 'Печатка',
      },
    },
    form: {
      template: 'Шаблон',
      company: 'Контрагент',
      number: '№ документа',
      date: 'Дата',
      includeStamp: 'Включити печатку',
      lineItems: {
        title: 'Товари / послуги',
        item: 'Товар',
        quantity: 'Кількість',
        unit: 'Одиниця',
        price: 'Ціна',
        priceOverride: 'Ціна (ручна)',
        total: 'Сума',
        add: 'Додати рядок',
      },
      totals: {
        subtotal: 'Сума без ПДВ',
        vat: 'ПДВ 20%',
        total: 'Разом з ПДВ',
      },
    },
    audit: {
      title: 'Журнал дій',
      actions: {
        created: 'Створено',
        exported: 'Експортовано',
        deleted: 'Видалено',
      },
    },
    empty: 'Документів ще немає',
    stamps: {
      title: 'Печатки',
      description:
        'Печатки можна використовувати в будь-якому шаблоні. Завантажте зображення (PNG, SVG, JPEG) і призначте його шаблонам.',
      empty: 'Печаток ще немає',
      namePlaceholder: 'Назва печатки',
      addButton: 'Додати печатку',
    },
    templatesEmpty: 'Шаблонів ще немає',
    noTemplatesHint: 'Спершу створіть шаблон у налаштуваннях',
    settingsDescription:
      'Шаблони визначають структуру документів — які поля відображаються, як розраховуються підсумки.',
    settingsEmptyHint: 'Створіть перший шаблон, обравши тип документа:',
    validation: {
      templateRequired: 'Оберіть шаблон',
      companyRequired: 'Оберіть контрагента',
      numberRequired: 'Вкажіть номер документа',
      lineItemRequired: 'Додайте хоча б один товар',
      fieldRequired: "Обов'язкове поле",
    },
    myCompany: {
      title: 'Моя компанія',
      description:
        'Реквізити вашої компанії як постачальника. Використовуються у згенерованих документах. Дані попередньо заповнені — за потреби виправте.',
      save: 'Зберегти',
      saved: 'Збережено',
      fields: {
        name: 'Повна назва',
        egrpou: 'ЄДРПОУ',
        inn: 'ІПН',
        vatCertificate: 'Номер свідоцтва ПДВ',
        iban: 'Р/р (IBAN)',
        bankName: 'Банк',
        mfo: 'МФО',
        phone: 'Телефон',
        address: 'Адреса',
        taxNote: 'Податковий статус',
        signatoryName: 'Підписант (для підпису)',
      },
    },
  },
  '/library': {
    title: 'Бібліотека',
  },
  '/library/settings': {
    title: 'Налаштування бібліотеки',
    sections: {
      actions: { submit: 'Додати', inputLabel: 'Додати нове найменування' },
      units: {
        title: 'Одиниці',
        description:
          "В рахунках для товарів та послуг використовуються різні одиниці вимірювання, які залежать від конкретного об'єкта. Найчастіше зустрічаються штуки, метри (погонні та квадратні), кілограми, години, доби, а також грошові одиниці (гривні). Важливо, щоб одиниця виміру була чітко вказана та відповідала суті операції, щоб уникнути непорозумінь. \n",
      },
      types: {
        title: 'Типи',
        description:
          'Типи можна розуміти як категорії товарів, які можуть вказуватися в рахунказ чи інших документах. Типи існують для легшої роботи зі списками товарів і не несуть ніякого юридичного значення.',
      },
    },
  },
  '/library/client': {
    title: 'Покупці',
    actions: {
      primary: 'Додати нового клієнта',
    },
    dialogs: {
      add: {
        title: 'Додати нового клієнта',
        description:
          'Введіть ЄДРПОУ (8 цифр) або ІК (10 цифр), щоб відшукати контрагента.\n Для юридичних осіб дані завантажуються автоматично. Для ФОП — заповніть вручну.',
        placeholder: 'ЄДРПОУ (8 цифр) або ІК (10 цифр)',
        actions: {
          primary: 'Зберегти',
          secondary: 'Пошук',
        },
        fop: {
          title: 'Додати ФОП',
          description: 'ФОП не знайдено в базі. Заповніть дані вручну.',
          fields: {
            name: 'ПІБ / Назва',
            address: 'Адреса',
            phone: 'Телефон',
          },
        },
      },
    },
    table: {
      headers: {
        entity_type: 'Форма',
        egrpou: 'ЄДРПОУ',
        ik: 'ІК',
        name: 'Назва',
        name_short: 'Коротка назва',
        address: 'Юридична адреса',
        phone: 'Телефон',
        kved_number: 'КВЕД',
        kved: 'Опис КВЕДу',
        director: 'ПІБ керівника',
        director_gen: 'ПІБ керівника в родовому відмінку',
        inn: 'Номер платника ПДВ',
        inn_date: 'Дата присвоєння номера платника ПД',
        last_sync: 'Востаннє оновлено',
        type: 'Тип',
      },
    },
  },
  '/library/source': {
    title: 'Продавці',
    actions: {
      primary: 'Додати нового продавця',
    },
    dialogs: {
      add: {
        title: 'Додати нового продавця',
        description:
          'Введіть ЄДРПОУ (8 цифр) або ІК (10 цифр), щоб відшукати контрагента.\n Для юридичних осіб дані завантажуються автоматично. Для ФОП — заповніть вручну.',
        placeholder: 'ЄДРПОУ (8 цифр) або ІК (10 цифр)',
        actions: {
          primary: 'Зберегти',
          secondary: 'Пошук',
        },
        fop: {
          title: 'Додати ФОП',
          description: 'ФОП не знайдено в базі. Заповніть дані вручну.',
          fields: {
            name: 'ПІБ / Назва',
            address: 'Адреса',
            phone: 'Телефон',
          },
        },
      },
    },
    table: {
      headers: {
        entity_type: 'Форма',
        egrpou: 'ЄДРПОУ',
        ik: 'ІК',
        name: 'Назва',
        name_short: 'Коротка назва',
        address: 'Юридична адреса',
        phone: 'Телефон',
        kved_number: 'КВЕД',
        kved: 'Опис КВЕДу',
        director: 'ПІБ керівника',
        director_gen: 'ПІБ керівника в родовому відмінку',
        inn: 'Номер платника ПДВ',
        inn_date: 'Дата присвоєння номера платника ПД',
        last_sync: 'Востаннє оновлено',
        type: 'Тип',
      },
    },
  },
  '/library/items': {
    title: 'Товари',
    actions: {
      primary: 'Додати новий товар',
    },
    table: {
      headers: {
        name: 'Назва',
        unit: 'Одиниці',
        priceInputVATFree: 'Відпускна ціна без ПДВ',
        priceOutputVATFree: 'Вхідна ціна без ПДВ',
        priceRetailInclVAT: 'Роздрібна ціна з ПДВ',
        type: 'Тип',
      },
    },
    dialogs: {
      add: {
        title: 'Додати новий товар',
        description: '',
      },
      edit: {
        title: 'Корегувати товар',
        description:
          'Зміни існуючого товару не поширюються на документи які були сформовані в минулому. Якщо Вам потрібно змінити і товар, і документ, внесіть зміни до обох окремо.',
      },
      actions: { primary: 'Зберегти' },
    },
  },
  root: {
    sidebar: {
      menu: {
        signout: 'Вихід',
      },
    },
  },
};

export const getTitle = (location: Location) => {
  const entry = i18n[location.pathname as keyof typeof i18n];
  return entry && 'title' in entry ? entry.title : undefined;
};
