'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ZoApiDocsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        ZO Backend API Documentation
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        External ZO backend APIs for authentication, profile, and avatar management
                    </p>

                    {/* Warning Banner */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Security Notice
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        This API requires credentials (<code className="bg-yellow-100 px-1 py-0.5 rounded">client-key</code>,
                                        <code className="bg-yellow-100 px-1 py-0.5 rounded ml-1">client-device-id</code>,
                                        <code className="bg-yellow-100 px-1 py-0.5 rounded ml-1">client-device-secret</code>) from the ZO team.
                                    </p>
                                    <p className="mt-1">
                                        <strong>Never expose these credentials in public repositories.</strong> Contact <a href="mailto:dev@zo.xyz" className="underline">dev@zo.xyz</a> for API access.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    For comprehensive documentation with code examples, see <a href="/ZO_API.md" className="font-medium underline" target="_blank">ZO_API.md</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SwaggerUI
                        url="/openapi-external.yaml"
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
