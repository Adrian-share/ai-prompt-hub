import { CacheItem } from './types';

/**
 * 简单的内存缓存实现
 * 支持可配置的过期时间
 */
class MemoryCache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttlSeconds 过期时间（秒），可选，默认使用构造函数中的默认值
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTTL;
    
    this.cache.set(key, {
      data: value,
      expireAt: Date.now() + ttl,
    });
  }

  /**
   * 删除缓存值
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// 从环境变量获取默认 TTL，默认 300 秒（5 分钟）
const defaultTTL = parseInt(process.env.CACHE_TTL || '300', 10);

// 导出单例缓存实例
export const cache = new MemoryCache(defaultTTL);

// 导出类以便测试
export { MemoryCache };
