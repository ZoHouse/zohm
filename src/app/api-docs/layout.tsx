import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'API Documentation - ZO House',
    description: 'Interactive API documentation for ZO House internal endpoints',
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
