import './App.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { router } from './lib/routes.tsx';

const _queryClient = new QueryClient();

// biome-ignore lint/style/noNonNullAssertion: Root is always going to be present
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={_queryClient}>
			<RouterProvider router={router} />
			<Toaster position="top-right" richColors={true} closeButton={true} />
		</QueryClientProvider>
	</StrictMode>,
);
