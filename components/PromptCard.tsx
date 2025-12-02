'use client';

import { Prompt } from '@/lib/types';

interface PromptCardProps {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
}

/**
 * Prompt 卡片组件
 * 显示标题、描述预览、分类标签，支持点击事件
 */
export default function PromptCard({ prompt, onClick }: PromptCardProps) {
  // 截断描述文本，最多显示 100 个字符
  const truncatedDescription = prompt.description.length > 100
    ? prompt.description.slice(0, 100) + '...'
    : prompt.description;

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer p-4 border border-gray-100"
      onClick={() => onClick(prompt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(prompt);
        }
      }}
      aria-label={`查看 ${prompt.title} 详情`}
    >
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {prompt.title}
      </h3>

      {/* 描述预览 */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
        {truncatedDescription}
      </p>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {prompt.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {prompt.category}
          </span>
        )}
        {prompt.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            {tag}
          </span>
        ))}
        {prompt.tags?.length > 3 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
            +{prompt.tags.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}
