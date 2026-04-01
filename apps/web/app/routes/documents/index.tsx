import type { Route } from '../../../.react-router/types/app/routes/documents/+types';

import { getTitle } from '~/i18n';


export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export function loader() {
  return { message: 'Hello, home!' };
}

export default function Documents({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.message}</div>;
}
