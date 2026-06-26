import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Location } from 'react-router-dom';

// Localization is organised as one i18next namespace per route path (plus a
// `root` namespace for shared chrome and a `document` namespace for the plural
// noun forms used when generating documents). Single locale (uk); resources are
// bundled inline so initialisation is synchronous and SSR-safe in workerd.

const resources = {
  uk: {
    '/': { title: 'Головна' },
    '/documents': {
      title: 'Документи',
      empty: 'Документів ще немає',
      placeStamp: 'М.П.',
      typeLabels: {
        invoices: 'Рахунки фактури',
        bills: 'Видаткові накладні',
        poas: 'Довіренності',
      },
      formatLabels: { xlsx: 'XLSX', pdf: 'PDF' },
      detail: { numberLabel: '№', dateLabel: 'від' },
      actions: {
        newDocument: 'Новий документ',
        newTemplate: 'Новий шаблон',
        export: { xlsx: 'Завантажити XLSX', pdf: 'Завантажити PDF' },
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
          headers: { name: 'Назва', type: 'Тип', createdAt: 'Створено', updatedAt: 'Оновлено' },
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
        totals: { subtotal: 'Сума без ПДВ', vat: 'ПДВ 20%', total: 'Разом з ПДВ' },
      },
      audit: {
        title: 'Журнал дій',
        actions: { created: 'Створено', exported: 'Експортовано', deleted: 'Видалено' },
      },
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
    '/documents/settings': { title: 'Налаштування' },
    '/documents/poas': { title: 'Довіренності' },
    '/documents/bills': { title: 'Видаткові накладні' },
    '/documents/invoices': { title: 'Рахунки фактури' },
    '/library': { title: 'Бібліотека' },
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
    '/library/client': libraryContactsNamespace('Покупці', 'Додати нового клієнта'),
    '/library/source': libraryContactsNamespace('Продавці', 'Додати нового продавця'),
    '/library/items': {
      title: 'Товари',
      actions: { primary: 'Додати новий товар' },
      table: {
        headers: {
          name: 'Назва',
          unit: 'Одиниці',
          priceSaleVATFree: 'Відпускна ціна без ПДВ',
          priceCostVATFree: 'Вхідна ціна без ПДВ',
          priceRetailInclVAT: 'Роздрібна ціна з ПДВ',
          type: 'Тип',
        },
      },
      dialogs: {
        add: { title: 'Додати новий товар', description: '' },
        edit: {
          title: 'Корегувати товар',
          description:
            'Зміни існуючого товару не поширюються на документи які були сформовані в минулому. Якщо Вам потрібно змінити і товар, і документ, внесіть зміни до обох окремо.',
        },
        actions: { primary: 'Зберегти' },
      },
    },
    root: { sidebar: { menu: { signout: 'Вихід' } } },
    // Plural noun forms used by the document generator (engine). i18next selects
    // the form via Intl.PluralRules('uk').
    document: {
      hryvnia_one: 'гривня',
      hryvnia_few: 'гривні',
      hryvnia_many: 'гривень',
      hryvnia_other: 'гривень',
      kopeck_one: 'копійка',
      kopeck_few: 'копійки',
      kopeck_many: 'копійок',
      kopeck_other: 'копійок',
      thousand_one: 'тисяча',
      thousand_few: 'тисячі',
      thousand_many: 'тисяч',
      thousand_other: 'тисяч',
      million_one: 'мільйон',
      million_few: 'мільйони',
      million_many: 'мільйонів',
      million_other: 'мільйонів',
    },
  },
} as const;

// Buyers (/library/client) and sellers (/library/source) share the same shape.
function libraryContactsNamespace(title: string, primaryAction: string) {
  return {
    title,
    actions: { primary: primaryAction },
    dialogs: {
      add: {
        title: primaryAction,
        description:
          'Введіть ЄДРПОУ (8 цифр) або ІК (10 цифр), щоб відшукати контрагента.\n Для юридичних осіб дані завантажуються автоматично. Для ФОП — заповніть вручну.',
        placeholder: 'ЄДРПОУ (8 цифр) або ІК (10 цифр)',
        actions: { primary: 'Зберегти', secondary: 'Пошук' },
        fop: {
          title: 'Додати ФОП',
          description: 'ФОП не знайдено в базі. Заповніть дані вручну.',
          fields: { name: 'ПІБ / Назва', address: 'Адреса', phone: 'Телефон' },
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
  };
}

export const SUPPORTED_NAMESPACES = Object.keys(resources.uk);

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'uk',
    fallbackLng: 'uk',
    defaultNS: 'root',
    ns: SUPPORTED_NAMESPACES,
    resources,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export type Resources = (typeof resources)['uk'];

/**
 * Typed accessor for a route-path namespace's strings from the i18next store.
 * Keeps call sites strongly typed while sourcing all copy from i18next.
 */
export function tns<K extends keyof Resources>(name: K): Resources[K] {
  return i18n.getResourceBundle('uk', name as string) as Resources[K];
}

/** Page title for the current route, looked up from its route-path namespace. */
export const getTitle = (location: Location): string | undefined => {
  const ns = location.pathname;
  if (!i18n.exists('title', { ns })) return undefined;
  return i18n.t('title', { ns });
};

export default i18n;
