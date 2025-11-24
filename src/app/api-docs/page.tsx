'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        ZO House API Documentation
                    </h1>
                    <p className="text-lg text-gray-600">
                        Internal API endpoints for the ZO House application
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SwaggerUI
                        url="/openapi-internal.yaml"
                        deepLinking={true}
                        displayRequestDuration={true}
                        filter={true}
                        tryItOutEnabled={true}
                        persistAuthorization={true}
                        docExpansion="list"
                        defaultModelsExpandDepth={1}
                        defaultModelExpandDepth={1}
                    />
                </div>
            </div>
        </div>
    );
}
