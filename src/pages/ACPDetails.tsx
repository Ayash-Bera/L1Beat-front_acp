import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { ACP } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';
import 'github-markdown-css/github-markdown.css';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/avalanche-foundation/ACPs/main/ACPs';

export function ACPDetails() {
  const { number } = useParams();
  const navigate = useNavigate();
  const [acp, setAcp] = useState<ACP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchACP() {
      try {
        setLoading(true);
        setError(null);

        const readmeUrl = `${GITHUB_RAW_URL}/${number}-*/README.md`;
        const response = await fetch(readmeUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch ACP details');
        }

        const markdown = await response.text();
        const parsedAcp = parseACPMarkdown(markdown, number || '');

        if (!parsedAcp) {
          throw new Error('Failed to parse ACP details');
        }

        setAcp(parsedAcp);
      } catch (err) {
        console.error('Error fetching ACP:', err);
        setError('Failed to load ACP details');
      } finally {
        setLoading(false);
      }
    }

    if (number) {
      fetchACP();
    }
  }, [number]);

  function parseACPMarkdown(markdown: string, acpNumber: string): ACP | null {
    try {
      const lines = markdown.split('\n');
      let title = '';
      let authors = [];
      let status = '';
      let track = '';
      let discussion = '';
      let inTable = false;

      for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith('| ACP |')) {
          inTable = true;
          continue;
        }

        if (!inTable) continue;

        if (line.startsWith('##')) break;

        if (line.includes('| **Title** |')) {
          title = line.split('|')[2].trim();
        } else if (line.includes('| **Author(s)** |')) {
          const authorText = line.split('|')[2];
          authors = parseAuthors(authorText);
        } else if (line.includes('| **Status** |')) {
          const statusText = line.split('|')[2];
          status = parseStatus(statusText);
          discussion = parseDiscussionLink(statusText);
        } else if (line.includes('| **Track** |')) {
          track = line.split('|')[2].trim();
        }
      }

      return {
        number: acpNumber,
        title,
        authors,
        status,
        track,
        content: markdown,
        discussion
      };
    } catch (err) {
      console.error(`Error parsing ACP-${acpNumber}:`, err);
      return null;
    }
  }

  function parseAuthors(text: string) {
    const authors = [];
    const matches = text.match(/([^(@\n]+)(?:\s*\([@]([^)]+)\))?/g);

    if (matches) {
      matches.forEach(match => {
        const [_, name, github] = match.match(/([^(@\n]+)(?:\s*\([@]([^)]+)\))?/) || [];
        if (name) {
          authors.push({
            name: name.trim(),
            github: github?.trim() || name.trim()
          });
        }
      });
    }

    return authors;
  }

  function parseStatus(text: string): string {
    const statusMatch = text.match(/\[([^\]]+)\]|\b(\w+)\b/);
    return (statusMatch?.[1] || statusMatch?.[2] || 'Unknown').trim();
  }

  function parseDiscussionLink(text: string): string | undefined {
    const match = text.match(/\[Discussion\]\(([^)]+)\)/);
    return match ? match[1] : undefined;
  }

  function getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('activated')) {
      return 'text-green-500 dark:text-green-400';
    }
    if (statusLower.includes('draft') || statusLower.includes('proposed')) {
      return 'text-yellow-500 dark:text-yellow-400';
    }
    if (statusLower.includes('rejected')) {
      return 'text-red-500 dark:text-red-400';
    }
    return 'text-gray-500 dark:text-gray-400';
  }

  function getStatusIcon(status: string) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('activated')) {
      return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />;
    }
    if (statusLower.includes('draft') || statusLower.includes('proposed')) {
      return <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
    }
    if (statusLower.includes('rejected')) {
      return <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />;
    }
    return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !acp) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{error}</h2>
            <button
              onClick={() => navigate('/acps')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ACPs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/acps')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ACPs
            </button>
            <ThemeToggle />
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ACP-{acp.number}
                </span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(acp.status)}
                  <span className={`text-sm font-medium ${getStatusColor(acp.status)}`}>
                    {acp.status}
                  </span>
                </div>
                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {acp.track}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {acp.title}
              </h1>

              <div className="flex flex-wrap gap-2 mb-6">
                {acp.authors.map((author, index) => (
                  <a
                    key={index}
                    href={`https://github.com/${author.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {author.name}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ))}
              </div>

              {acp.discussion && (
                <div className="mb-6">
                  <a
                    href={acp.discussion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    View Discussion
                    <ExternalLink className="ml-2 -mr-1 h-4 w-4" />
                  </a>
                </div>
              )}

              <div 
                className="prose dark:prose-invert max-w-none markdown-body bg-white dark:bg-dark-800"
                dangerouslySetInnerHTML={{ __html: marked(acp.content) }}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}