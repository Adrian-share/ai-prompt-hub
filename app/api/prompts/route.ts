import { NextResponse } from 'next/server';
import { fetchBitableRecords, extractCategories } from '@/lib/feishu';
import { cache } from '@/lib/cache';
import { Prompt, PromptsResponse, ErrorResponse } from '@/lib/types';
import { getPrompts } from '@/lib/sync';

const MEMORY_CACHE_KEY = 'prompts_data';

interface CachedData {
  prompts: Prompt[];
  categories: string[];
}

/**
 * 判断是否在生产环境（有 Vercel KV）
 */
function hasVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function GET(): Promise<
  NextResponse<PromptsResponse | ErrorResponse>
> {
  try {
    let prompts: Prompt[];
    let categories: string[];

    if (hasVercelKV()) {
      // 生产环境：使用 Vercel KV
      const result = await getPrompts();
      prompts = result.prompts;
      categories = result.categories;
    } else {
      // 开发环境：使用内存缓存
      const cachedData = cache.get<CachedData>(MEMORY_CACHE_KEY);

      if (cachedData) {
        prompts = cachedData.prompts;
        categories = cachedData.categories;
      } else {
        prompts = await fetchBitableRecords();
        categories = extractCategories(prompts);
        cache.set<CachedData>(MEMORY_CACHE_KEY, { prompts, categories });
      }
    }

    return NextResponse.json({
      success: true,
      data: prompts,
      total: prompts.length,
      categories,
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Failed to fetch prompts:', error);

    // Try to return cached data if available (even if expired)
    const cachedData = cache.get<CachedData>(MEMORY_CACHE_KEY);
    if (cachedData) {
      console.log('Returning stale cached data due to API error');
      return NextResponse.json({
        success: true,
        data: cachedData.prompts,
        total: cachedData.prompts.length,
        categories: cachedData.categories,
      });
    }

    // Return error response
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'FETCH_ERROR',
        message: errorMessage.includes('Missing')
          ? '服务配置错误，请联系管理员'
          : '数据加载失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
