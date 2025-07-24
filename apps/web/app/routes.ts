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
      route('clients', 'routes/library/clients/index.tsx'),
      route('search-company', 'routes/library/api/search-company.ts'),
      route('item-management', 'routes/library/api/item-management.ts'),
      route('enums/:key/:id?', 'routes/library/api/enums-management.ts'),
      route('save-company', 'routes/library/api/save-company.ts'),
      route('sources', 'routes/library/sources/index.tsx'),
      route('items', 'routes/library/items/index.tsx'),
      route('settings', 'routes/library/settings/index.tsx'),
    ]),
  ]),
] satisfies RouteConfig;
