import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, ChevronRight, X, FileText, Github } from 'lucide-react';
import { DOCS, getCategory, getPage, getDefaultPage, searchDocs } from '../docs/structure';
import { URLS } from '../constants/urls';

const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ category?: string; page?: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve which doc page to show. Default to Quick Start when no params.
  const { categorySlug, pageSlug } = useMemo(() => {
    if (params.category && params.page) {
      return { categorySlug: params.category, pageSlug: params.page };
    }
    return getDefaultPage();
  }, [params.category, params.page]);

  const category = getCategory(categorySlug);
  const page = getPage(categorySlug, pageSlug);

  const searchResults = useMemo(() => searchDocs(searchQuery), [searchQuery]);

  const goToPage = (cat: string, pg: string) => {
    navigate(`/docs/${cat}/${pg}`);
    setSearchQuery('');
  };

  return (
    <div className="flex h-full min-h-0">
      {/* ================ Sidebar ================ */}
      <aside className="w-72 flex-shrink-0 border-r border-surface-200 bg-surface-50 overflow-y-auto">
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="input pl-9 pr-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search results override the category nav when query is present */}
          {searchQuery ? (
            <div>
              <h3 className="label mb-2">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</h3>
              {searchResults.length === 0 ? (
                <p className="text-xs text-surface-500 px-2">Nothing matched "{searchQuery}".</p>
              ) : (
                <ul className="space-y-1">
                  {searchResults.map(({ category: c, page: p, snippet }) => (
                    <li key={`${c.slug}/${p.slug}`}>
                      <button
                        onClick={() => goToPage(c.slug, p.slug)}
                        className="w-full text-left p-2 rounded-lg hover:bg-surface-100 transition-colors"
                      >
                        <div className="text-xs text-surface-500 mb-0.5">{c.title}</div>
                        <div className="text-sm font-medium text-surface-800 truncate">{p.title}</div>
                        {snippet && (
                          <div className="text-[11px] text-surface-500 mt-0.5 line-clamp-2">{snippet}</div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <nav className="space-y-5">
              {DOCS.map((cat) => {
                const Icon = cat.icon;
                const isActiveCategory = cat.slug === categorySlug;
                return (
                  <div key={cat.slug}>
                    <h3 className="flex items-center gap-2 text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2 px-2">
                      <Icon size={12} />
                      {cat.title}
                    </h3>
                    <ul className="space-y-0.5">
                      {cat.pages.map((p) => {
                        const isActive = isActiveCategory && p.slug === pageSlug;
                        return (
                          <li key={p.slug}>
                            <button
                              onClick={() => goToPage(cat.slug, p.slug)}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                                isActive
                                  ? 'bg-primary-100 text-primary-900 font-medium'
                                  : 'text-surface-700 hover:bg-surface-100'
                              }`}
                            >
                              {p.title}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>
          )}

          {/* External links */}
          <div className="mt-8 pt-5 border-t border-surface-200 space-y-2">
            <a
              href={URLS.REPO}
              onClick={(e) => {
                e.preventDefault();
                window.open(URLS.REPO, '_blank');
              }}
              className="flex items-center gap-2 text-xs text-surface-500 hover:text-surface-800 px-2 py-1 rounded transition-colors"
            >
              <Github size={12} />
              View source on GitHub
            </a>
          </div>
        </div>
      </aside>

      {/* ================ Content ================ */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {!category || !page ? (
            <div className="text-center py-16">
              <FileText size={32} className="mx-auto text-surface-300 mb-3" />
              <h2 className="text-lg font-display text-surface-700">Page not found</h2>
              <p className="text-sm text-surface-500 mt-2">
                The page you requested doesn't exist. Pick something from the sidebar.
              </p>
            </div>
          ) : (
            <>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-xs text-surface-500 mb-4">
                <span>Documentation</span>
                <ChevronRight size={12} />
                <span>{category.title}</span>
                <ChevronRight size={12} />
                <span className="text-surface-700">{page.title}</span>
              </nav>

              {/* Markdown content */}
              <article className="docs-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
              </article>

              {/* Footer nav: prev / next within this category */}
              <PageFooterNav category={category} pageSlug={page.slug} onNavigate={goToPage} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const PageFooterNav: React.FC<{
  category: ReturnType<typeof getCategory>;
  pageSlug: string;
  onNavigate: (cat: string, page: string) => void;
}> = ({ category, pageSlug, onNavigate }) => {
  if (!category) return null;
  const idx = category.pages.findIndex((p) => p.slug === pageSlug);
  const prev = idx > 0 ? category.pages[idx - 1] : null;
  const next = idx >= 0 && idx < category.pages.length - 1 ? category.pages[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="mt-12 pt-6 border-t border-surface-200 flex items-center justify-between gap-4">
      {prev ? (
        <button
          onClick={() => onNavigate(category.slug, prev.slug)}
          className="flex-1 text-left p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
        >
          <div className="text-[11px] text-surface-500 mb-0.5">← Previous</div>
          <div className="text-sm font-medium text-surface-800">{prev.title}</div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <button
          onClick={() => onNavigate(category.slug, next.slug)}
          className="flex-1 text-right p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
        >
          <div className="text-[11px] text-surface-500 mb-0.5">Next →</div>
          <div className="text-sm font-medium text-surface-800">{next.title}</div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
};

export default DocsPage;
