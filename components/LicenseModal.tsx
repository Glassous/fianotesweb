import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface License {
  name: string;
  version?: string;
  license?: string | { type: string; url?: string };
  repository?: string | { type?: string; url?: string; directory?: string };
  author?: string | { name: string };
  licenseText?: string;
}

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRepositoryUrl = (repository: License['repository']): string | null => {
  if (!repository) return null;
  if (typeof repository === 'string') {
    if (repository.startsWith('github:')) {
      return `https://github.com/${repository.substring(7)}`;
    }
    return repository;
  }
  if (typeof repository === 'object' && repository.url) {
    let url = repository.url;
    if (url.startsWith('git+')) {
      url = url.substring(4);
    }
    return url;
  }
  return null;
};

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && licenses.length === 0) {
      setLoading(true);
      fetch('/oss-licenses.json')
        .then(res => {
             if (!res.ok) throw new Error('Failed to load licenses');
             return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                setLicenses(data);
            } else {
                setLicenses([]);
            }
        })
        .catch(err => {
            console.error(err);
            setError(t('app.loadLicenseError', 'Failed to load license information'));
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, licenses.length, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('app.openSource', 'Open Source Declaration')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Project Info */}
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <span className="font-bold text-xl">FiaNotes</span>
             </div>
             <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                {t('app.description', 'A modern, Markdown-centric note-taking application featuring a robust file explorer, auto-generated outlines, and code visualization.')}
             </p>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                <div>
                    <span className="text-zinc-500 dark:text-zinc-500 block text-xs uppercase tracking-wider mb-1">{t('app.author', 'Author')}</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Glassous</span>
                </div>
                 <div>
                    <span className="text-zinc-500 dark:text-zinc-500 block text-xs uppercase tracking-wider mb-1">{t('app.license', 'License')}</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Apache 2.0</span>
                </div>
                 <div className="col-span-1 sm:col-span-2">
                    <span className="text-zinc-500 dark:text-zinc-500 block text-xs uppercase tracking-wider mb-1">{t('app.repository', 'Repository')}</span>
                    <a href="https://github.com/Glassous/fianotesweb" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        https://github.com/Glassous/fianotesweb
                    </a>
                </div>
             </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 my-4"></div>

          {/* Open Source Libraries */}
          <div>
            <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {t('app.libraries', 'Open Source Libraries')}
            </h3>
            
            {loading ? (
                <div className="text-center py-8 text-zinc-500 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-b-blue-500 mb-2"></div>
                    {t('app.loadingLicenses', 'Loading licenses...')}
                </div>
            ) : error ? (
                <div className="text-center py-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-4 border border-red-100 dark:border-red-900/30">
                    {error}
                </div>
            ) : (
                <div className="space-y-3">
                    {licenses.map((lib, idx) => (
                        <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded border border-zinc-100 dark:border-zinc-800 text-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{lib.name}</span>
                                {lib.version && <span className="text-xs font-mono text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">{lib.version}</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                                {lib.author && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        {typeof lib.author === 'object' ? lib.author.name : lib.author}
                                    </span>
                                )}
                                {lib.license && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {typeof lib.license === 'object' ? lib.license.type : lib.license}
                                    </span>
                                )}
                            </div>
                            {getRepositoryUrl(lib.repository) && (
                                <a href={getRepositoryUrl(lib.repository)!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline truncate max-w-full">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    {getRepositoryUrl(lib.repository)}
                                </a>
                            )}
                        </div>
                    ))}
                    {licenses.length === 0 && (
                        <p className="text-zinc-500 text-sm italic text-center py-4">
                            {t('app.noLicenses', 'No license information found.')}
                        </p>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
