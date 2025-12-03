import { fetchBitableRecords, extractCategories } from './feishu';
import { setPromptsToKV, getPromptsFromKV } from './kv-cache';
import { Prompt } from './types';

export interface SyncResult {
  success: boolean;
  promptCount: number;
  categoryCount: number;
  syncTime: string;
  error?: string;
}

/**
 * 从飞书同步数据到 KV 缓存
 */
export async function syncPromptsToCache(): Promise<SyncResult> {
  const syncTime = new Date().toISOString();

  try {
    console.log(`Starting sync at ${syncTime}`);

    // 从飞书获取最新数据
    const prompts = await fetchBitableRecords();
    const categories = extractCategories(prompts);

    console.log(
      `Fetched ${prompts.length} prompts, ${categories.length} categories`
    );

    // 保存到 KV 缓存
    const saved = await setPromptsToKV(prompts, categories);

    if (!saved) {
      throw new Error('Failed to save to KV cache');
    }

    return {
      success: true,
      promptCount: prompts.length,
      categoryCount: categories.length,
      syncTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Sync failed at ${syncTime}:`, errorMessage);

    return {
      success: false,
      promptCount: 0,
      categoryCount: 0,
      syncTime,
      error: errorMessage,
    };
  }
}

/**
 * 获取 prompts 数据（优先从缓存，否则从飞书获取并缓存）
 */
export async function getPrompts(): Promise<{
  prompts: Prompt[];
  categories: string[];
  fromCache: boolean;
}> {
  // 尝试从 KV 缓存获取
  const cached = await getPromptsFromKV();

  if (cached) {
    console.log(
      `Returning cached data (version: ${cached.version}, lastSync: ${cached.lastSync})`
    );
    return {
      prompts: cached.prompts,
      categories: cached.categories,
      fromCache: true,
    };
  }

  // 缓存未命中，从飞书获取并缓存
  console.log('Cache miss, fetching from Feishu...');
  const prompts = await fetchBitableRecords();
  const categories = extractCategories(prompts);

  // 异步保存到缓存（不阻塞响应）
  setPromptsToKV(prompts, categories).catch((error) => {
    console.error('Failed to cache prompts:', error);
  });

  return {
    prompts,
    categories,
    fromCache: false,
  };
}
