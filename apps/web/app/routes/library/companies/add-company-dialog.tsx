'use client';

import { useFetcher, useRevalidator } from 'react-router-dom';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { i18n as i } from '~/i18n';
import type { SaveCompanyLoader } from '~/routes/library/_api/save-company';
import type { SearchCompanyLoader } from '~/routes/library/_api/search-company';

const labels = i['/library/client'];

export const AddCompanyDialog = ({
  i18n,
  type,
}: {
  i18n: typeof labels;
  type: 'client' | 'source';
}) => {
  const searchFetcher = useFetcher<SearchCompanyLoader>();
  const saveFetcher = useFetcher<SaveCompanyLoader>();
  const revalidator = useRevalidator();

  const handleSubmit = async () => {
    if (searchFetcher.data?.data) {
      await saveFetcher.submit(
        { ...searchFetcher.data.data, type },
        {
          action: '/library/save-company',
        }
      );
      await revalidator.revalidate();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{i18n.actions.primary}</Button>
      </DialogTrigger>

      <DialogContent className={'w-auto max-h-3/4 overflow-y-auto'}>
        <DialogHeader>
          <DialogTitle>{i18n.dialogs.add.title}</DialogTitle>
          <DialogDescription>{i18n.dialogs.add.description}</DialogDescription>
        </DialogHeader>
        <searchFetcher.Form method={'get'} action={'/library/search-company'}>
          <div className="flex items-center gap-2">
            <Input
              placeholder={i18n.dialogs.add.placeholder}
              type="text"
              name="egrpou"
              minLength={8}
              maxLength={10}
            />
            <Button disabled={searchFetcher.state !== 'idle'} variant={'ghost'}>
              {i18n.dialogs.add.actions.secondary}
            </Button>
          </div>
        </searchFetcher.Form>
        {searchFetcher.data?.error && (
          <span className="text-red-500" data-state="error" data-slot="error">
            {searchFetcher.data?.error}
          </span>
        )}
        {searchFetcher.data?.data && (
          <table>
            {Object.keys(searchFetcher.data?.data).map((key) => (
              <tr key={key}>
                <td className="p-2 text-muted-foreground text-sm">{i18n.table.headers[key]}</td>
                <td className="p-2 text-sm leading-none font-medium">
                  {searchFetcher.data?.data[key]}
                </td>
              </tr>
            ))}
          </table>
        )}
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button disabled={!searchFetcher.data?.data} onClick={handleSubmit}>
              {i18n.dialogs.add.actions.primary}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
