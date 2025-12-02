import { MemoryCache } from '../cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache(60); // 60 seconds default TTL
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should store and retrieve complex objects', () => {
      const obj = { name: 'test', items: [1, 2, 3] };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });
  });

  describe('expiration', () => {
    it('should return null for expired items', async () => {
      const shortCache = new MemoryCache(0.001); // 1ms TTL
      shortCache.set('expiring', 'value');
      await new Promise((r) => setTimeout(r, 10)); // Wait 10ms
      expect(shortCache.get('expiring')).toBeNull();
    });

    it('should respect custom TTL', () => {
      cache.set('custom', 'value', 3600); // 1 hour TTL
      expect(cache.get('custom')).toBe('value');
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired keys', () => {
      cache.set('exists', 'value');
      expect(cache.has('exists')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('missing')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove a cached item', () => {
      cache.set('toDelete', 'value');
      cache.delete('toDelete');
      expect(cache.get('toDelete')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all cached items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });
});
