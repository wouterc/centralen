import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, LayoutDashboard, Clock, X, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    type: 'opgave' | 'viden' | 'tidsreg';
    id: number;
    title: string;
    subtitle: string;
    score: number;
    url: string;
}

const GlobalSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Handle Shortcut Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSelectedIndex(0);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Auto-scroll selected item into view
    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            const selectedElement = scrollContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex, isOpen]);

    // Search logic with debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await api.get<SearchResult[]>('/search/', { params: { q: query } });
                setResults(data);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        navigate(result.url);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'opgave': return <LayoutDashboard className="text-blue-500" size={18} />;
            case 'viden': return <FileText className="text-green-500" size={18} />;
            case 'tidsreg': return <Clock className="text-amber-500" size={18} />;
            default: return <Search size={18} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'opgave': return 'Opgave';
            case 'viden': return 'Vidensbank';
            case 'tidsreg': return 'Sagsnr.';
            default: return '';
        }
    };

    return (
        <div className="relative" ref={searchRef}>
            {/* The Trigger Button - Now just an icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isOpen ? 'text-red-600 bg-red-50 shadow-inner' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                title="Søg (⌘K)"
            >
                <Search size={20} />
            </button>

            {/* The Search Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center p-3 border-b border-gray-100 bg-gray-50/50">
                        <Search className="text-gray-400 mr-2" size={16} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Søg i alt..."
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-800 placeholder-gray-400"
                        />
                        {loading ? (
                            <Loader2 className="animate-spin text-indigo-500" size={16} />
                        ) : query && (
                            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="max-h-[60vh] overflow-y-auto custom-scrollbar"
                    >
                        {!query && (
                            <div className="p-6 text-center text-gray-400">
                                <p className="text-xs font-black uppercase tracking-widest opacity-40">Hurtig søgning</p>
                                <p className="text-[11px] font-medium mt-2">Søg på sagsnumre, opgaver eller vejledninger</p>
                            </div>
                        )}

                        {query && results.length === 0 && !loading && (
                            <div className="p-6 text-center text-gray-400">
                                <p className="text-xs font-bold">Ingen resultater for "{query}"</p>
                            </div>
                        )}

                        {results.length > 0 && (
                            <div className="p-1" role="listbox">
                                {results.map((result, index) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        data-index={index}
                                        role="option"
                                        aria-selected={index === selectedIndex}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left ${index === selectedIndex ? 'bg-indigo-600 text-white shadow-lg scale-[1.02] z-10' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${index === selectedIndex ? 'bg-white' : 'bg-gray-100'
                                            }`}>
                                            {getIcon(result.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[13px] font-bold truncate">
                                                    {result.title}
                                                </span>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${index === selectedIndex ? 'bg-indigo-400 text-white' :
                                                    result.type === 'opgave' ? 'bg-blue-100 text-blue-600' :
                                                        result.type === 'viden' ? 'bg-green-100 text-green-600' :
                                                            'bg-amber-100 text-amber-600'
                                                    }`}>
                                                    {getTypeLabel(result.type)}
                                                </span>
                                            </div>
                                            <div className={`text-[11px] truncate mt-0.5 ${index === selectedIndex ? 'text-white/80' : 'text-gray-400'}`}>
                                                {result.subtitle}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Shortcuts */}
                    <div className="bg-gray-50/80 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <div className="flex gap-3">
                            <span>↵ Vælg</span>
                            <span>↑↓ Naviger</span>
                        </div>
                        <div className="opacity-30">Centralen Search</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
