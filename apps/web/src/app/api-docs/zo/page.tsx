import ApiDocsViewer from '@/components/ApiDocsViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'External API Documentation | ZO',
    description: 'ZO Platform External API Documentation',
};

export default function ExternalApiDocsPage() {
    return <ApiDocsViewer defaultSpec="external" />;
}
