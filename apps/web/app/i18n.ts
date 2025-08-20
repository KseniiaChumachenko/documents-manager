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
          'Введіть ЄДРПОУ, щоб відшукати компанію в єдиному реєстрі.\n Якщо знайдена інформація коректна - збережіть її.',
        placeholder: 'ЄДРПОУ має складається з 8-10 цифр',
        actions: {
          primary: 'Зберегти',
          secondary: 'Пошук',
        },
      },
    },
    table: {
      headers: {
        egrpou: 'ЄДРПОУ',
        name: 'Назва',
        name_short: 'Коротка назва',
        address: 'Юридична адреса',
        kved_number: 'КВЕД',
        kved: 'Опис КВЕДу',
        director: 'ПІБ керівника',
        director_gen: 'ПІБ керівника в родовому відмінку',
        inn: 'Номер платника ПДВ',
        inn_date: 'Дата присвоєння номера платника ПД',
        last_update: 'Востаннє оновлено',
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
          'Введіть ЄДРПОУ, щоб відшукати компанію в єдиному реєстрі.\n Якщо знайдена інформація коректна - збережіть її.',
        placeholder: 'ЄДРПОУ має складається з 8 цифр',
        actions: {
          primary: 'Зберегти',
          secondary: 'Пошук',
        },
      },
    },
    table: {
      headers: {
        egrpou: 'ЄДРПОУ',
        name: 'Назва',
        name_short: 'Коротка назва',
        address: 'Юридична адреса',
        kved_number: 'КВЕД',
        kved: 'Опис КВЕДу',
        director: 'ПІБ керівника',
        director_gen: 'ПІБ керівника в родовому відмінку',
        inn: 'Номер платника ПДВ',
        inn_date: 'Дата присвоєння номера платника ПД',
        last_update: 'Востаннє оновлено',
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
          'Зміни існуючого товару не поширюются на документи які були сформовані в минулому. Якщо Вам потрібно змінити і товар, і документ, внесіть зміни до обох окремо.',
      },
      actions: { primary: 'Зберегти' },
    },
  },
  root:{
    sidebar:{
      menu: {
        signout: 'Вихід'
      }
    }
  }
};

export const getTitle = (location: Location) => i18n[location.pathname as keyof typeof i18n]?.title;
