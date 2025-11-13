
import React, { useState, useCallback } from 'react';
import { getTroubleshootingSteps } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

// Simple markdown to HTML renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h3>')
        .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">$1</h2>')
        .replace(/# (.*)/g, '<h1 class="text-2xl font-extrabold mt-8 mb-4 text-gray-900 dark:text-white">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 text-red-500 dark:text-red-400 rounded px-1 py-0.5 font-mono text-sm">$1</code>')
        .replace(/\n/g, '<br />');

    return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


export const AiAssistant: React.FC = () => {
    const [problem, setProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!problem.trim()) {
            setError('Please describe the problem.');
            return;
        }
        setError('');
        setIsLoading(true);
        setSolution('');
        try {
            const result = await getTroubleshootingSteps(problem);
            setSolution(result);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [problem]);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <SparklesIcon className="w-8 h-8 text-blue-500"/>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">AI Troubleshooter</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
                Describe an IT issue, and the AI assistant will provide step-by-step troubleshooting guidance.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="e.g., A user's computer is running very slow and frequently freezes."
                    className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    disabled={isLoading}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full md:w-auto flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Solution...
                        </>
                    ) : (
                        'Get Troubleshooting Steps'
                    )}
                </button>
            </form>

            {solution && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Suggested Solution</h2>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                       <MarkdownRenderer content={solution} />
                    </div>
                </div>
            )}
        </div>
    );
};

