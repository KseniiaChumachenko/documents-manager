import { getTitle } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/documents/invoices/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: { title: getTitle(location) } }];
}

export function loader() {
  return { message: 'Hello, library!' };
}

export default function Invoices({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.message}</div>;
}
