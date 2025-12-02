'use client';

import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/lib/types';

interface PromptDetailProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Prompt 详情弹窗组件
 * 显示完整 Prompt 内容和元数据，支持一键复制功能
 */
export default function PromptDetail({ prompt, isOpen, onClose }: PromptDetailProps) {
  const [copied, setCopied] = useState(false);

  // 复制 Prompt 内容到剪贴板
  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      // 500ms 后重置复制状态（符合 Requirement 4.3）
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [prompt]);

  // 按 ESC 键关闭弹窗
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 重置复制状态当弹窗关闭或 prompt 改变时
  useEffect(() => {
    setCopied(false);
  }, [prompt, isOpen]);

  if (!isOpen || !prompt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-detail-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 id="prompt-detail-title" className="text-xl font-bold text-gray-900">
              {prompt.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{prompt.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 分类和标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {prompt.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {prompt.category}
              </span>
            )}
            {prompt.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Prompt 内容 */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Prompt 内容</h3>
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={copied ? '已复制' : '复制 Prompt'}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    已复制
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    复制
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap break-words border border-gray-200 font-mono">
              {prompt.content}
            </pre>
          </div>

          {/* 元数据 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">创建时间</span>
                <p className="text-gray-900 mt-0.5">
                  {new Date(prompt.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">更新时间</span>
                <p className="text-gray-900 mt-0.5">
                  {new Date(prompt.updatedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
