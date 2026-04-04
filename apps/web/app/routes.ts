import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  layout('routes/layout.tsx', [
    index('routes/home/index.tsx'),

    route('documents', 'routes/documents/index.tsx', [
      route('settings', 'routes/documents/settings/index.tsx'),
      route(':type', 'routes/documents/type/index.tsx'),
      route(':type/new', 'routes/documents/type/new/index.tsx'),
      route(':type/settings', 'routes/documents/type/settings/index.tsx'),
      route(':type/settings/:templateId', 'routes/documents/type/settings/edit/index.tsx'),
      route(':type/:id', 'routes/documents/type/id/index.tsx'),

      // API's
      route('template-management', 'routes/documents/_api/template-management.ts'),
      route('stamp-upload', 'routes/documents/_api/stamp-upload.ts'),
      route('generate-document', 'routes/documents/_api/generate-document.ts'),
      route('export-document', 'routes/documents/_api/export-document.ts'),
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
