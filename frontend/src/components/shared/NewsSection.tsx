import { useState, useEffect } from 'react';
import {
  Newspaper,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Play,
  Pause,
} from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  image_url?: string | null;
  published_at: string | null;
  created_at: string;
  created_by: string;
}

interface NewsSectionProps {
  news: NewsItem[];
  loading?: boolean;
}

export default function NewsSection({ news, loading = false }: NewsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying || news.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= news.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, news.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? news.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= news.length - 1 ? 0 : prev + 1));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Get current news item
  const currentNews = news[currentIndex];

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-white/10 rounded-xl"></div>
          <div className="h-32 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-white font-semibold text-sm">News & Updates</h3>
          </div>
        </div>
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-center">
          <Newspaper className="w-10 h-10 text-white/40 mx-auto mb-2" />
          <p className="text-white/70 text-sm">No news available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl overflow-hidden shadow-lg">
        {/* Header Section - Purple/Indigo Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-3 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Newspaper className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm">News & Updates</h3>
              <span className="text-white/50 text-xs">({currentIndex + 1}/{news.length})</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Play/Pause */}
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isAutoPlaying ? (
                  <Pause className="w-3 h-3 text-white" />
                ) : (
                  <Play className="w-3 h-3 text-white" />
                )}
              </button>
              
              {/* Navigation */}
              {news.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* News Content Card - Teal/Cyan Gradient (Different Color) */}
        {currentNews && (
          <button
            onClick={() => setSelectedNews(currentNews)}
            className="w-full text-left bg-gradient-to-r from-teal-500 to-cyan-600 p-4 hover:from-teal-600 hover:to-cyan-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getPriorityStyle(currentNews.priority)}`}>
                {currentNews.priority}
              </span>
              <span className="text-white/60 text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(currentNews.published_at || currentNews.created_at)}
              </span>
            </div>
            <h4 className="text-white font-semibold text-base md:text-lg line-clamp-2 mb-2">
              {currentNews.title}
            </h4>
            <p className="text-white/80 text-sm line-clamp-2">
              {currentNews.summary || currentNews.content}
            </p>
            <div className="mt-3 flex items-center text-white/60 text-xs">
              <span>Click to read more</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        )}

        {/* Progress dots */}
        {news.length > 1 && (
          <div className="bg-slate-100 px-4 py-2 flex items-center justify-center gap-1.5">
            {news.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'w-5 h-1.5 bg-indigo-600' 
                    : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityStyle(selectedNews.priority)}`}>
                    {selectedNews.priority}
                  </span>
                  <span className="text-white/60 text-xs">
                    {formatDate(selectedNews.published_at || selectedNews.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedNews.title}</h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                {selectedNews.content}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Published by {selectedNews.created_by}
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t">
              <button
                onClick={() => setSelectedNews(null)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

