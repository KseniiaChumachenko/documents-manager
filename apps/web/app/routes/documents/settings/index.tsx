import type { ColumnDef } from '@tanstack/react-table';
import { Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate, Link, useFetcher } from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Typography } from '~/components/ui/typography';
import {
  documentTemplate,
  myCompany,
  stamp,
  type DocumentTemplate,
  type MyCompany,
  type Stamp,
} from '~/database/schema';
import { getTitle, tns } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/documents/settings/+types';
import type { MyCompanyAction } from '../_api/my-company';
import type { StampUploadAction } from '../_api/stamp-upload';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

const DOCUMENT_TYPES = ['invoices', 'bills', 'poas'] as const;

export async function loader({ context }: Route.LoaderArgs) {
  const [templates, stamps, companyRows] = await Promise.all([
    context.db.select().from(documentTemplate),
    context.db.select().from(stamp),
    context.db.select().from(myCompany).limit(1),
  ]);
  const company = companyRows[0] ?? null;

  // Build stamp data URLs for previews
  const stampPreviews: Record<number, string> = {};
  for (const s of stamps) {
    const obj = await context.cloudflare.env.TEMPLATES.get(s.imageKey);
    if (obj) {
      const buf = await obj.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let j = 0; j < bytes.byteLength; j++) {
        binary += String.fromCharCode(bytes[j]);
      }
      const contentType = obj.httpMetadata?.contentType ?? 'image/png';
      stampPreviews[s.id] = `data:${contentType};base64,${btoa(binary)}`;
    }
  }

  return { data: { templates, stamps, stampPreviews, company } };
}

const MY_COMPANY_FIELDS = [
  'name',
  'egrpou',
  'inn',
  'vatCertificate',
  'iban',
  'bankName',
  'mfo',
  'phone',
  'address',
  'taxNote',
  'signatoryName',
] as const;

function MyCompanySection({ company }: { company: MyCompany | null }) {
  const t = tns('/documents').myCompany;
  const fetcher = useFetcher<MyCompanyAction>();
  const saved = fetcher.state === 'idle' && fetcher.data?.data;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Typography variant="h4">{t.title}</Typography>
        <p className="text-muted-foreground text-sm mt-1">{t.description}</p>
      </div>
      <fetcher.Form
        method="POST"
        action="/documents/my-company"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl"
      >
        {MY_COMPANY_FIELDS.map((field) => (
          <div
            key={field}
            className={field === 'name' || field === 'address' ? 'sm:col-span-2' : ''}
          >
            <Label htmlFor={`mc-${field}`} className="pb-1 text-xs">
              {t.fields[field]}
            </Label>
            <Input id={`mc-${field}`} name={field} defaultValue={company?.[field] ?? ''} />
          </div>
        ))}
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" disabled={fetcher.state !== 'idle'}>
            {t.save}
          </Button>
          {saved && <span className="text-sm text-muted-foreground">{t.saved}</span>}
          {fetcher.data?.error && (
            <span className="text-destructive text-sm">{fetcher.data.error}</span>
          )}
        </div>
      </fetcher.Form>
    </div>
  );
}

function StampsSection({
  stamps,
  stampPreviews,
}: {
  stamps: Stamp[];
  stampPreviews: Record<number, string>;
}) {
  const t = tns('/documents');
  const fetcher = useFetcher<StampUploadAction>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stampName, setStampName] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !stampName.trim()) return;

    const formData = new FormData();
    formData.set('name', stampName.trim());
    formData.set('file', file);
    fetcher.submit(formData, {
      method: 'POST',
      action: '/documents/stamp-upload',
      encType: 'multipart/form-data',
    });
    setStampName('');
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: number) => {
    fetcher.submit(null, {
      method: 'DELETE',
      action: `/documents/stamp-upload?id=${id}`,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Typography variant="h4">{t.stamps.title}</Typography>
        <p className="text-muted-foreground text-sm mt-1">{t.stamps.description}</p>
      </div>

      {/* Stamp list */}
      {stamps.length === 0 ? (
        <p className="text-muted-foreground text-sm py-2">{t.stamps.empty}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {stamps.map((s) => (
            <div
              key={s.id}
              className="relative border rounded-md p-3 flex flex-col items-center gap-2"
            >
              {stampPreviews[s.id] ? (
                <img
                  src={stampPreviews[s.id]}
                  alt={s.name}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="h-16 w-16 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                  {t.placeStamp}
                </div>
              )}
              <span className="text-sm font-medium text-center">{s.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="absolute top-1 right-1 rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={`${t.actions.delete} ${s.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder={t.stamps.namePlaceholder}
            value={stampName}
            onChange={(e) => setStampName(e.target.value)}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={!stampName.trim() || fetcher.state !== 'idle'}
        >
          <Upload className="h-4 w-4 mr-2" />
          {t.stamps.addButton}
        </Button>
      </div>

      {fetcher.data?.error && <p className="text-destructive text-xs">{fetcher.data.error}</p>}
    </div>
  );
}

export default function DocumentSettings({ loaderData: { data } }: Route.ComponentProps) {
  const t = tns('/documents');
  const navigate = useNavigate();

  const columns: ColumnDef<DocumentTemplate>[] = [
    { accessorKey: 'name', header: t.templates.table.headers.name },
    { accessorKey: 'createdAt', header: t.templates.table.headers.createdAt },
    { accessorKey: 'updatedAt', header: t.templates.table.headers.updatedAt },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Typography variant="h3">{t.actions.settings}</Typography>
        <p className="text-muted-foreground text-sm mt-1">{t.settingsDescription}</p>
      </div>

      {/* My company section */}
      <MyCompanySection company={data.company} />

      {/* Stamps section */}
      <StampsSection stamps={data.stamps} stampPreviews={data.stampPreviews} />

      {/* Template sections */}
      {DOCUMENT_TYPES.map((docType) => {
        const typeLabel = t.typeLabels[docType];
        const templates = data.templates.filter((tmpl) => tmpl.type === docType);
        return (
          <div key={docType} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Typography variant="h4">{typeLabel}</Typography>
              <Link to={`/documents/${docType}/settings/new`}>
                <Button variant="outline" size="sm">
                  {t.actions.newTemplate} {typeLabel}
                </Button>
              </Link>
            </div>

            {templates.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">{t.templatesEmpty}</p>
            ) : (
              <DataTable
                data={templates}
                columns={columns}
                onRowClick={(row) => {
                  navigate(`/documents/${docType}/settings/${row.id}`);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const ErrorBoundary = EB;
