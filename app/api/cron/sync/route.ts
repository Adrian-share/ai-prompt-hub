import { NextRequest, NextResponse } from 'next/server';
import { syncPromptsToCache, SyncResult } from '@/lib/sync';
import { isCacheStale } from '@/lib/kv-cache';

/**
 * Cron Job 定时同步端点
 * GET /api/cron/sync
 *
 * 由 Vercel Cron 每小时调用一次
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证 Cron 请求（Vercel 会自动添加此 header）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // 如果配置了 CRON_SECRET，则验证 Authorization header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查缓存是否过期
    const stale = await isCacheStale();

    if (!stale) {
      console.log('Cache is still fresh, skipping sync');
      return NextResponse.json({
        success: true,
        message: 'Cache is fresh, sync skipped',
        synced: false,
      });
    }

    // 执行同步
    console.log('Cache is stale, starting sync...');
    const result: SyncResult = await syncPromptsToCache();

    if (result.success) {
      console.log(`Cron sync completed: ${result.promptCount} prompts`);
      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        synced: true,
        ...result,
      });
    } else {
      console.error('Cron sync failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Sync failed',
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron job error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: 'Cron job failed',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
