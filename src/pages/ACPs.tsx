import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACP } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { FileText, ExternalLink, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const GITHUB_API_URL = 'https://api.github.com/repos/avalanche-foundation/ACPs/contents/ACPs';

export function ACPs() {
  const navigate = useNavigate();
  const [acps, setAcps] = useState<ACP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchACPs() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch ACPs');
        }

        const folders = await response.json();
        const acpFolders = folders.filter((folder: any) => folder.type === 'dir');

        const acpPromises = acpFolders.map(async (folder: any) => {
          const folderName = folder.name;
          const match = folderName.match(/^(\d+)-/);
          if (!match) return null;

          const number = match[1];
          const readmeUrl = `${GITHUB_API_URL}/${folderName}/README.md`;
          const readmeResponse = await fetch(readmeUrl);
          
          if (!readmeResponse.ok) {
            console.warn(`Failed to fetch README for ACP-${number}`);
            return null;
          }

          const readmeData = await readmeResponse.json();
          const content = atob(readmeData.content);
          
          // Parse the markdown content
          const lines = content.split('\n');
          let title = '';
          let authors = [];
          let status = '';
          let track = '';
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
              status = line.split('|')[2].trim();
            } else if (line.includes('| **Track** |')) {
              track = line.split('|')[2].trim();
            }
          }

          return {
            number,
            title,
            authors,
            status,
            track,
            content
          };
        });

        const acpsData = (await Promise.all(acpPromises))
          .filter((acp): acp is ACP => acp !== null)
          .sort((a, b) => Number(b.number) - Number(a.number));

        setAcps(acpsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching ACPs:', err);
        setError('Failed to load ACPs');
      } finally {
        setLoading(false);
      }
    }

    fetchACPs();
  }, []);

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

  if (error || !acps.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {error || 'No ACPs available'}
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Avalanche Consensus Proposals (ACPs)
            </h1>
            <ThemeToggle />
          </div>

          <div className="grid gap-4">
            {acps.map(acp => (
              <div
                key={acp.number}
                className="bg-white dark:bg-dark-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 p-4 cursor-pointer"
                onClick={() => navigate(`/acps/${acp.number}`)}
              >
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

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {acp.title}
                </h2>

                <div className="flex flex-wrap gap-2">
                  {acp.authors.map((author, index) => (
                    <a
                      key={index}
                      href={`https://github.com/${author.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {author.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}