/**
 * Prompt 数据模型
 */
export interface Prompt {
  id: string;           // 飞书记录 ID
  title: string;        // Prompt 标题
  description: string;  // 简短描述
  content: string;      // 完整 Prompt 内容
  category: string;     // 分类
  tags: string[];       // 标签数组
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}

/**
 * API 成功响应 - GET /api/prompts
 */
export interface PromptsResponse {
  success: true;
  data: Prompt[];
  total: number;
  categories: string[];
}

/**
 * API 错误响应
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

/**
 * API 响应联合类型
 */
export type ApiResponse = PromptsResponse | ErrorResponse;

/**
 * 飞书 API 认证响应
 */
export interface FeishuTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

/**
 * 飞书多维表格记录字段（支持中英文字段名）
 */
export interface FeishuBitableFields {
  // 英文字段名
  title?: string | { text: string }[];
  description?: string | { text: string }[];
  content?: string | { text: string }[];
  category?: string | string[];
  tags?: string[];
  // 中文字段名
  名字?: string | { text: string }[];
  描述?: string | { text: string }[];
  内容?: string | { text: string }[];
  tag?: string | string[];
}

/**
 * 飞书多维表格记录
 */
export interface FeishuBitableRecord {
  record_id: string;
  fields: FeishuBitableFields;
}

/**
 * 飞书多维表格查询响应
 */
export interface FeishuBitableResponse {
  code: number;
  msg: string;
  data?: {
    items: FeishuBitableRecord[];
    total: number;
    has_more: boolean;
    page_token?: string;
  };
}

/**
 * 缓存项
 */
export interface CacheItem<T> {
  data: T;
  expireAt: number;
}

// ========== Webhook 相关类型 ==========

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  promptCount: number;
  categoryCount: number;
  syncTime: string;
  error?: string;
}

/**
 * 缓存的 Prompts 数据
 */
export interface CachedPromptsData {
  prompts: Prompt[];
  categories: string[];
  lastSync: string;
  version: number;
}

/**
 * 飞书事件订阅 - Header
 */
export interface FeishuEventHeader {
  event_id: string;
  event_type: string;
  create_time: string;
  token: string;
  app_id: string;
  tenant_key: string;
}

/**
 * 飞书事件订阅 - Bitable 记录变更事件
 */
export interface FeishuBitableRecordChangedEvent {
  action_list: Array<{
    action: 'record_added' | 'record_edited' | 'record_deleted';
    record_id: string;
  }>;
  file_token: string;
  file_type: string;
  operator_id: {
    open_id: string;
    union_id: string;
    user_id: string;
  };
  subscriber_id_list: Array<{
    subscriber_id: string;
    subscriber_id_type: string;
  }>;
  table_id: string;
}
