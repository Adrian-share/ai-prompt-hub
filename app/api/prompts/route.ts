import { NextResponse } from 'next/server';
import { fetchBitableRecords, extractCategories } from '@/lib/feishu';
import { cache } from '@/lib/cache';
import { Prompt, PromptsResponse, ErrorResponse } from '@/lib/types';

const CACHE_KEY = 'prompts_data';

interface CachedData {
  prompts: Prompt[];
  categories: string[];
}

export async function GET(): Promise<NextResponse<PromptsResponse | ErrorResponse>> {
  try {
    // Check cache first
    const cachedData = cache.get<CachedData>(CACHE_KEY);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.prompts,
        total: cachedData.prompts.length,
        categories: cachedData.categories,
      });
    }

    // Fetch from Feishu API
    const prompts = await fetchBitableRecords();
    const categories = extractCategories(prompts);

    // Cache the result
    cache.set<CachedData>(CACHE_KEY, { prompts, categories });

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
    const cachedData = cache.get<CachedData>(CACHE_KEY);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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
