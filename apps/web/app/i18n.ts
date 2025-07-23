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
    title: 'Налаштування',
  },
  '/library/clients': {
    title: 'Покупці',
    actions: {
      primary: 'Додати нового клієнта',
    },
    dialogs: {
      add: {
        title: 'Додати нового клієнта',
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
  '/library/sources': {
    title: 'Продавці',
  },
  '/library/items': {
    title: 'Товари',
  },
};

export const getTitle = (location: Location) => i18n[location.pathname as keyof typeof i18n]?.title;
