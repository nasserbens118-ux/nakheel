import '../globals.css';
import { ClientOnly } from './client';

export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['auth'] },
    { slug: ['about'] },
    { slug: ['traceability'] },
    { slug: ['profile'] },
    { slug: ['tests'] },
    { slug: ['supplier', 'dashboard'] },
    { slug: ['supplier', 'declare'] },
    { slug: ['supplier', 'list'] },
    { slug: ['client', 'catalog'] },
    { slug: ['client', 'orders'] },
    { slug: ['client', 'feedback'] },
    { slug: ['operator', 'dashboard'] },
    { slug: ['operator', 'subscription'] },
    { slug: ['admin', 'dashboard'] },
    { slug: ['admin', 'waste'] },
    { slug: ['admin', 'batches'] },
    { slug: ['admin', 'orders'] },
    { slug: ['admin', 'complaints'] },
    { slug: ['admin', 'ai'] },
    { slug: ['admin', 'pending'] },
    { slug: ['admin', 'prices'] },
    { slug: ['admin', 'subscriptions'] },
    { slug: ['admin', 'calendar'] },
  ];
}

export default function Page() {
  return <ClientOnly />;
}
