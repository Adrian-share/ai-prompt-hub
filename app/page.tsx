'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Prompt, PromptsResponse } from '@/lib/types';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import PromptCard from '@/components/PromptCard';
import PromptDetail from '@/components/PromptDetail';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  // 数据状态
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 详情弹窗状态
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 数据获取函数
  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();

      if (data.success) {
        const result = data as PromptsResponse;
        setPrompts(result.data);
        setCategories(result.categories);
      } else {
        setError(data.message || '数据加载失败，请稍后重试');
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('网络连接失败，请检查网络后重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载数据
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // 搜索和筛选逻辑
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    // 分类筛选
    if (selectedCategory) {
      result = result.filter((prompt) => prompt.category === selectedCategory);
    }

    // 关键词搜索（搜索标题和描述）
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(keyword) ||
          prompt.description.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [prompts, selectedCategory, searchKeyword]);

  // 打开详情弹窗
  const handlePromptClick = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsDetailOpen(true);
  }, []);

  // 关闭详情弹窗
  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPrompt(null);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 头部区域 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6">
            AI Prompt Hub
          </h1>
          <p className="text-center text-gray-600 mb-6">
            发现和浏览各种 AI Prompt
          </p>

          {/* 搜索和筛选区域 */}
          <div className="space-y-4">
            {/* 搜索栏 */}
            <SearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="搜索 Prompt 标题或描述..."
            />

            {/* 分类筛选 */}
            {categories.length > 0 && (
              <CategoryFilter
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            )}
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500">正在加载 Prompt 列表...</p>
          </div>
        )}

        {/* 错误状态 */}
        {!isLoading && error && (
          <ErrorMessage message={error} onRetry={fetchPrompts} />
        )}

        {/* Prompt 列表 */}
        {!isLoading && !error && (
          <>
            {/* 结果统计 */}
            <div className="mb-4 text-sm text-gray-500">
              共找到 {filteredPrompts.length} 个 Prompt
              {selectedCategory && ` · 分类: ${selectedCategory}`}
              {searchKeyword && ` · 搜索: "${searchKeyword}"`}
            </div>

            {/* 无结果提示 */}
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  未找到匹配的 Prompt
                </h3>
                <p className="text-gray-500 mb-4">
                  尝试调整搜索关键词或清除筛选条件
                </p>
                <div className="flex justify-center gap-3">
                  {searchKeyword && (
                    <button
                      onClick={() => setSearchKeyword('')}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      清除搜索
                    </button>
                  )}
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      清除分类筛选
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Prompt 卡片网格 - 响应式布局 */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={handlePromptClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Prompt 详情弹窗 */}
      <PromptDetail
        prompt={selectedPrompt}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </main>
  );
}
