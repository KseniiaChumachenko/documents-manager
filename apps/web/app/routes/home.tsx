import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Document Manager' },
    { name: 'description', content: 'Welcome to Document Manager' },
  ];
}

export function loader() {
  return { message: 'Hello, home!' };
}

export default function Home({ loaderData }) {
  return <div>{loaderData.message}</div>;
}
