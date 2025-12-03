import * as crypto from 'crypto';

/**
 * 飞书事件订阅的请求体结构
 */
export interface FeishuEventPayload {
  // URL 验证挑战
  challenge?: string;
  token?: string;
  type?: string;

  // 加密事件
  encrypt?: string;

  // 事件通知
  schema?: string;
  header?: {
    event_id: string;
    event_type: string;
    create_time: string;
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event?: {
    action_list?: Array<{
      action: string; // 'record_added' | 'record_edited' | 'record_deleted'
      record_id: string;
    }>;
    file_token?: string;
    file_type?: string;
    operator_id?: {
      open_id: string;
      union_id: string;
      user_id: string;
    };
    subscriber_id_list?: Array<{
      subscriber_id: string;
      subscriber_id_type: string;
    }>;
    table_id?: string;
  };
}

/**
 * 验证飞书 Webhook 请求签名
 * 飞书使用 SHA256 验证
 */
export function verifyFeishuSignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  encryptKey: string
): boolean {
  // 飞书签名算法: SHA256(timestamp + nonce + encrypt_key + body)
  const content = timestamp + nonce + encryptKey + body;
  const computedSignature = crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');

  return computedSignature === signature;
}

/**
 * 解密飞书加密事件（如果启用了加密）
 */
export function decryptFeishuEvent(
  encrypt: string,
  encryptKey: string
): string {
  const key = crypto.createHash('sha256').update(encryptKey).digest();
  const encryptedBuffer = Buffer.from(encrypt, 'base64');

  // 前16字节是 IV
  const iv = encryptedBuffer.slice(0, 16);
  const encryptedData = encryptedBuffer.slice(16);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // 移除 PKCS7 padding
  const padLen = decrypted[decrypted.length - 1];
  return decrypted.slice(0, decrypted.length - padLen).toString('utf8');
}

/**
 * 判断是否为 URL 验证挑战请求
 */
export function isUrlVerification(payload: FeishuEventPayload): boolean {
  return payload.type === 'url_verification' && !!payload.challenge;
}

/**
 * 判断是否为 Bitable 记录变更事件
 */
export function isBitableRecordChanged(payload: FeishuEventPayload): boolean {
  return payload.header?.event_type === 'drive.file.bitable_record_changed_v1';
}
