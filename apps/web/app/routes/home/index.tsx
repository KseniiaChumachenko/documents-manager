import { getTitle } from '~/i18n';

import type { Route } from '../../../.react-router/types/app/routes/home/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export function loader() {
  return { message: 'Hello, home!' };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.message}</div>;
}
