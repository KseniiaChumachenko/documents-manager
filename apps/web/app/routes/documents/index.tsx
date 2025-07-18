import type { Route } from '../../../.react-router/types/app/routes/+types';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Document Manager' },
    { name: 'description', content: 'Welcome to Document Manager' },
  ];
}

export function loader() {
  return { message: 'Hello, home!' };
}

export default function Index({ loaderData }) {
  return <div>{loaderData.message}</div>;
}
