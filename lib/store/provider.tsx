'use client';

import { Provider } from 'react-redux';
import storeInstance from './index';

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider store={storeInstance}>{children}</Provider>;
} 