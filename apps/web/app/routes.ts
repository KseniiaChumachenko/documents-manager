import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/home/index.tsx'),

    route('documents', 'routes/documents/index.tsx', [
      route('poas', 'routes/documents/poas/index.tsx'),
      route('bills', 'routes/documents/bills/index.tsx'),
      route('invoices', 'routes/documents/invoices/index.tsx'),
      route('settings', 'routes/documents/settings/index.tsx'),
    ]),

    route('library', 'routes/library/index.tsx', [
      route('items', 'routes/library/items/index.tsx'),
      route('settings', 'routes/library/settings/index.tsx'),
      route(':type', 'routes/library/companies/index.tsx'),

      // API's
      route('search-company', 'routes/library/_api/search-company.ts'),
      route('item-management', 'routes/library/_api/item-management.ts'),
      route('enums/:key/:id?', 'routes/library/_api/enums-management.ts'),
      route('save-company', 'routes/library/_api/save-company.ts'),
    ]),
  ]),
] satisfies RouteConfig;
