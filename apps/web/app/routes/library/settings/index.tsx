import type { Route } from './+types/library';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Document Manager' },
    { name: 'description', content: 'Welcome to Document Manager' },
  ];
}

export function loader() {
  return { message: 'Hello, library!' };
}

export default function Home({ loaderData }) {
  return <div>{loaderData.message}</div>;
}
