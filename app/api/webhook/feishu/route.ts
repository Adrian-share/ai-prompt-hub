import { NextRequest, NextResponse } from 'next/server';
import {
  FeishuEventPayload,
  verifyFeishuSignature,
  decryptFeishuEvent,
  isUrlVerification,
  isBitableRecordChanged,
} from '@/lib/feishu-webhook';
import { syncPromptsToCache } from '@/lib/sync';

// 已处理事件 ID 缓存（防止重复处理）
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 1000;

/**
 * 飞书 Webhook 端点
 * POST /api/webhook/feishu
 */
export async function POST(request: NextRequest) {
  try {
    const encryptKey = process.env.FEISHU_ENCRYPT_KEY || '';
    const verificationToken = process.env.FEISHU_VERIFICATION_TOKEN || '';

    // 获取请求体
    const rawBody = await request.text();
    let payload: FeishuEventPayload;

    // 尝试解析 JSON
    try {
      const parsed = JSON.parse(rawBody);

      // 如果是加密的事件，先解密
      if (parsed.encrypt && encryptKey) {
        const decrypted = decryptFeishuEvent(parsed.encrypt, encryptKey);
        payload = JSON.parse(decrypted);
      } else {
        payload = parsed;
      }
    } catch (e) {
      console.error('Failed to parse webhook payload:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 处理 URL 验证挑战
    if (isUrlVerification(payload)) {
      console.log('Responding to URL verification challenge');
      return NextResponse.json({ challenge: payload.challenge });
    }

    // 验证 Token（简单验证）
    const eventToken = payload.header?.token || payload.token;
    if (verificationToken && eventToken !== verificationToken) {
      console.error('Token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 可选：验证签名（如果配置了 Encrypt Key）
    if (encryptKey) {
      const timestamp = request.headers.get('X-Lark-Request-Timestamp') || '';
      const nonce = request.headers.get('X-Lark-Request-Nonce') || '';
      const signature = request.headers.get('X-Lark-Signature') || '';

      if (
        signature &&
        !verifyFeishuSignature(timestamp, nonce, rawBody, signature, encryptKey)
      ) {
        console.error('Signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // 检查事件是否已处理（防止重复）
    const eventId = payload.header?.event_id;
    if (eventId) {
      if (processedEvents.has(eventId)) {
        console.log(`Event ${eventId} already processed, skipping`);
        return NextResponse.json({ code: 0, msg: 'ok' });
      }

      // 添加到已处理集合
      processedEvents.add(eventId);

      // 限制集合大小
      if (processedEvents.size > MAX_PROCESSED_EVENTS) {
        const firstKey = processedEvents.values().next().value;
        if (firstKey) {
          processedEvents.delete(firstKey);
        }
      }
    }

    // 处理 Bitable 记录变更事件
    if (isBitableRecordChanged(payload)) {
      console.log('Bitable record changed, triggering sync...');
      console.log('Event details:', JSON.stringify(payload.event, null, 2));

      // 检查是否是目标表格
      const targetTableId = process.env.FEISHU_BITABLE_TABLE_ID;
      if (targetTableId && payload.event?.table_id !== targetTableId) {
        console.log('Event is for a different table, ignoring');
        return NextResponse.json({ code: 0, msg: 'ok' });
      }

      // 异步触发同步，不阻塞响应
      syncPromptsToCache().catch((error) => {
        console.error('Sync failed:', error);
      });

      console.log('Sync triggered successfully');
    }

    // 飞书要求返回 200 + { code: 0 }
    return NextResponse.json({ code: 0, msg: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // 即使出错也返回 200，避免飞书重试
    return NextResponse.json({ code: 0, msg: 'error handled' });
  }
}

// 支持 GET 用于健康检查
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Feishu Webhook',
    timestamp: new Date().toISOString(),
  });
}
