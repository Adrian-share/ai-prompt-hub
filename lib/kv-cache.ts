import { kv } from '@vercel/kv';
import { Prompt } from './types';

// 缓存键名
const PROMPTS_KEY = 'prompts:data';
const CATEGORIES_KEY = 'prompts:categories';
const LAST_SYNC_KEY = 'prompts:last_sync';
const CACHE_VERSION_KEY = 'prompts:version';

// 缓存 TTL（秒）- 1 小时
const CACHE_TTL = 3600;

export interface CachedPromptsData {
  prompts: Prompt[];
  categories: string[];
  lastSync: string;
  version: number;
}

/**
 * 从 KV 获取 prompts 数据
 */
export async function getPromptsFromKV(): Promise<CachedPromptsData | null> {
  try {
    const [prompts, categories, lastSync, version] = await Promise.all([
      kv.get<Prompt[]>(PROMPTS_KEY),
      kv.get<string[]>(CATEGORIES_KEY),
      kv.get<string>(LAST_SYNC_KEY),
      kv.get<number>(CACHE_VERSION_KEY),
    ]);

    if (!prompts || !categories) {
      return null;
    }

    return {
      prompts,
      categories,
      lastSync: lastSync || 'unknown',
      version: version || 0,
    };
  } catch (error) {
    console.error('Failed to get data from KV:', error);
    return null;
  }
}

/**
 * 将 prompts 数据保存到 KV
 */
export async function setPromptsToKV(
  prompts: Prompt[],
  categories: string[]
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const currentVersion = (await kv.get<number>(CACHE_VERSION_KEY)) || 0;

    await Promise.all([
      kv.set(PROMPTS_KEY, prompts, { ex: CACHE_TTL }),
      kv.set(CATEGORIES_KEY, categories, { ex: CACHE_TTL }),
      kv.set(LAST_SYNC_KEY, now, { ex: CACHE_TTL }),
      kv.set(CACHE_VERSION_KEY, currentVersion + 1, { ex: CACHE_TTL }),
    ]);

    console.log(`KV cache updated at ${now}, version: ${currentVersion + 1}`);
    return true;
  } catch (error) {
    console.error('Failed to set data to KV:', error);
    return false;
  }
}

/**
 * 使缓存失效
 */
export async function invalidatePromptsCache(): Promise<void> {
  try {
    await Promise.all([
      kv.del(PROMPTS_KEY),
      kv.del(CATEGORIES_KEY),
      kv.del(LAST_SYNC_KEY),
    ]);
    console.log('KV cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate KV cache:', error);
  }
}

/**
 * 获取上次同步时间
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await kv.get<string>(LAST_SYNC_KEY);
  } catch (error) {
    console.error('Failed to get last sync time:', error);
    return null;
  }
}

/**
 * 检查缓存是否过期（超过 1 小时未更新）
 */
export async function isCacheStale(): Promise<boolean> {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;

  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  return now - lastSyncTime > ONE_HOUR;
}
