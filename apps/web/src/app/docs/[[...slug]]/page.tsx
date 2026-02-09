import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Map URL slugs to file names in the Docs folder
const docsBasePath = path.join(process.cwd(), '..', '..', 'Docs');

interface DocsPageProps {
    params: Promise<{ slug?: string[] }>;
}

async function getDocContent(slugArray: string[] | undefined): Promise<{ content: string; title: string } | null> {
    let filePath: string;
    let title: string;

    if (!slugArray || slugArray.length === 0) {
        // Index page
        filePath = path.join(docsBasePath, 'INDEX.md');
        title = 'Documentation Index';
    } else {
        const slug = slugArray.join('/');
        filePath = path.join(docsBasePath, `${slug}.md`);
        title = slugArray[slugArray.length - 1].replace(/_/g, ' ');
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return { content, title };
    } catch {
        return null;
    }
}

export default async function DocsPage({ params }: DocsPageProps) {
    const resolvedParams = await params;
    const doc = await getDocContent(resolvedParams.slug);

    if (!doc) {
        notFound();
    }

    return (
        <article className="docs-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Main title - large, white, clean
                    h1: ({ children }) => (
                        <h1 className="text-4xl md:text-5xl font-bold font-syne mb-8 text-white tracking-tight leading-tight">
                            {children}
                        </h1>
                    ),
                    // Section headers - clear visual break
                    h2: ({ children }) => (
                        <h2 className="text-2xl md:text-3xl font-bold mt-16 mb-6 pb-4 border-b border-white/20 text-white tracking-tight">
                            {children}
                        </h2>
                    ),
                    // Subsection headers
                    h3: ({ children }) => (
                        <h3 className="text-xl md:text-2xl font-semibold mt-12 mb-4 text-pink-300">
                            {children}
                        </h3>
                    ),
                    // Sub-subsection
                    h4: ({ children }) => (
                        <h4 className="text-lg font-semibold mt-8 mb-3 text-gray-200">
                            {children}
                        </h4>
                    ),
                    // Body text - readable, well-spaced
                    p: ({ children }) => (
                        <p className="text-gray-200 text-lg leading-relaxed mb-6">
                            {children}
                        </p>
                    ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-pink-400 hover:text-pink-300 underline underline-offset-4 decoration-pink-400/50 hover:decoration-pink-300 transition-colors"
                        >
                            {children}
                        </a>
                    ),
                    // Unordered lists
                    ul: ({ children }) => (
                        <ul className="space-y-3 mb-6 ml-1">
                            {children}
                        </ul>
                    ),
                    // Ordered lists
                    ol: ({ children }) => (
                        <ol className="space-y-3 mb-6 ml-1 list-decimal list-inside">
                            {children}
                        </ol>
                    ),
                    // List items
                    li: ({ children }) => (
                        <li className="text-gray-200 text-lg leading-relaxed flex items-start gap-3">
                            <span className="text-pink-400 mt-1.5">•</span>
                            <span className="flex-1">{children}</span>
                        </li>
                    ),
                    // Inline code
                    code: ({ className, children }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code className="px-2 py-1 bg-white/10 rounded-md text-sm text-pink-300 font-mono border border-white/10">
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className={className}>
                                {children}
                            </code>
                        );
                    },
                    // Code blocks
                    pre: ({ children }) => (
                        <pre className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6 overflow-x-auto my-8 text-sm">
                            {children}
                        </pre>
                    ),
                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-8 rounded-xl border border-white/10">
                            <table className="min-w-full">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-white/5">
                            {children}
                        </thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white border-b border-white/10">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-6 py-4 text-sm text-gray-200 border-b border-white/5">
                            {children}
                        </td>
                    ),
                    // Blockquotes - styled callouts
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-pink-500 bg-pink-500/10 pl-6 pr-4 py-4 my-8 rounded-r-xl">
                            <div className="text-gray-100 italic">
                                {children}
                            </div>
                        </blockquote>
                    ),
                    // Horizontal rules
                    hr: () => (
                        <hr className="border-white/10 my-12" />
                    ),
                    // Strong/bold text
                    strong: ({ children }) => (
                        <strong className="font-semibold text-white">
                            {children}
                        </strong>
                    ),
                    // Emphasis/italic
                    em: ({ children }) => (
                        <em className="italic text-gray-100">
                            {children}
                        </em>
                    ),
                }}
            >
                {doc.content}
            </ReactMarkdown>
        </article>
    );
}
