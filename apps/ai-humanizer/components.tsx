
import React, { useState } from 'react';
import { AnalysisResult } from './types';
import { getScoreColor } from './utils';

export const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-16 h-16 rounded-full animate-spin border-4 border-solid border-purple-500 border-t-transparent"></div>
      <p className="text-lg font-semibold text-gray-600">{message}</p>
    </div>
);

export const WelcomePanel: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-4xl font-extrabold mb-4 text-black">Welcome!</h2>
        <p className="text-gray-600 max-w-sm">
            Paste your text or upload a file to begin. Our advanced analyzer will expose AI traits, and our new humanizer will make it undetectable.
        </p>
    </div>
);

const AnalysisCard: React.FC<{ title: string, description: string, value: string }> = ({ title, description, value }) => (
    <div className="bg-white p-4 border-2 border-black">
        <h4 className="font-bold text-lg text-black">{title}</h4>
        <p className="text-gray-500 text-sm mb-2">{description}</p>
        <p className="font-bold text-xl text-purple-600">{value}</p>
    </div>
);

export const ResultsPanel: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const { aiScore, summary, perplexity, burstiness, uniformity } = result;
    const scoreColor = getScoreColor(aiScore);

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-black">Likelihood of AI Content</h3>
            <div className={`text-center p-6 border-2 border-black mb-6 ${scoreColor.bg}`}>
                <p className={`text-6xl font-extrabold ${scoreColor.text}`}>{aiScore}%</p>
            </div>
            <p className="text-gray-700 mb-6">{summary}</p>
            <div className="grid gap-4">
                <AnalysisCard title="Perplexity" description="Measures text predictability. Lower scores are more AI-like." value={perplexity.value} />
                <AnalysisCard title="Burstiness" description="Measures sentence length variation. Uniformity suggests AI." value={burstiness.value} />
                <AnalysisCard title="Uniformity" description="Analyzes phrasing consistency. Repetitive structure is a key AI trait." value={uniformity.value} />
            </div>
        </div>
    );
};

export const HumanizerPanel: React.FC<{ text: string, score: number | null }> = ({ text, score }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'humanized-text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-black">Humanized Text</h3>
                {score !== null && (
                    <div className="text-right">
                        <p className="font-semibold text-gray-600">New AI Score</p>
                        <p className={`text-4xl font-extrabold ${getScoreColor(score).text}`}>{score}%</p>
                    </div>
                )}
            </div>
            <div className="w-full h-80 p-4 border-2 border-black bg-gray-100 overflow-y-auto mb-4 text-black">
                {text}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleCopy}
                    className={`w-full font-bold py-2 px-4 border-2 border-black shadow-[2px_2px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all ${copied ? 'bg-green-400' : 'bg-yellow-300'}`}
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                    onClick={handleDownload}
                    className="w-full font-bold py-2 px-4 border-2 border-black shadow-[2px_2px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all bg-blue-300"
                >
                    Download
                </button>
            </div>
        </div>
    );
};
