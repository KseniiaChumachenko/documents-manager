import { getLibraryView } from '~/routes/library/commons/library-view';

const { meta: m, ErrorBoundary: EB, loader: l, Component } = getLibraryView('client');

export const meta = m;
export const ErrorBoundary = EB;
export const loader = l;

export default Component;
