'use client';

import { useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface ApiDocsViewerProps {
    defaultSpec?: 'external' | 'internal';
}

export default function ApiDocsViewer({ defaultSpec = 'external' }: ApiDocsViewerProps) {
    const [activeSpec, setActiveSpec] = useState<'external' | 'internal'>(defaultSpec);

    return (
        <div className="min-h-screen bg-white text-black p-4">
            <div className="container mx-auto">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl font-bold mb-6 text-gray-900">ZO API Documentation</h1>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveSpec('external')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeSpec === 'external'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            External API
                        </button>
                        <button
                            onClick={() => setActiveSpec('internal')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeSpec === 'internal'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Internal API
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <SwaggerUI
                        url={activeSpec === 'external' ? '/openapi-external.yaml' : '/openapi-internal.yaml'}
                        docExpansion="list"
                        persistAuthorization={true}
                    />
                </div>
            </div>
        </div>
    );
}
