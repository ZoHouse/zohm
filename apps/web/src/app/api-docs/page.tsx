import ApiDocsViewer from '@/components/ApiDocsViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'API Documentation | ZO',
    description: 'ZO Platform API Documentation',
};

export default function ApiDocsPage() {
    return <ApiDocsViewer defaultSpec="internal" />;
}
