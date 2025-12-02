import {
  Prompt,
  FeishuTokenResponse,
  FeishuBitableResponse,
  FeishuBitableFields,
} from './types';

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

// Token cache
let tokenCache: { token: string; expireAt: number } | null = null;

/**
 * 获取飞书 tenant_access_token
 */
export async function getTenantAccessToken(): Promise<string> {
  // Check if cached token is still valid (with 60s buffer)
  if (tokenCache && tokenCache.expireAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET environment variables');
  }

  const response = await fetch(
    `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get tenant_access_token: ${response.status}`);
  }

  const data: FeishuTokenResponse = await response.json();

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Feishu API error: ${data.msg}`);
  }

  // Cache the token
  tokenCache = {
    token: data.tenant_access_token,
    expireAt: Date.now() + (data.expire || 7200) * 1000,
  };

  return data.tenant_access_token;
}


/**
 * 从飞书字段中提取文本值
 */
function extractTextValue(field: string | { text: string }[] | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0 && typeof field[0] === 'object') {
    return field.map((item) => item.text).join('');
  }
  return '';
}

/**
 * 从飞书字段中提取分类值
 */
function extractCategoryValue(field: string | string[] | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0] || '';
  return '';
}

/**
 * 将飞书记录转换为 Prompt 对象（支持中英文字段名）
 */
function transformRecord(recordId: string, fields: FeishuBitableFields): Prompt {
  return {
    id: recordId,
    title: extractTextValue(fields.title || fields.名字),
    description: extractTextValue(fields.description || fields.描述),
    content: extractTextValue(fields.content || fields.内容),
    category: extractCategoryValue(fields.category || fields.tag),
    tags: Array.isArray(fields.tags) ? fields.tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 查询飞书多维表格数据
 */
export async function fetchBitableRecords(): Promise<Prompt[]> {
  const appToken = process.env.FEISHU_BITABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_BITABLE_TABLE_ID;

  if (!appToken || !tableId) {
    throw new Error('Missing FEISHU_BITABLE_APP_TOKEN or FEISHU_BITABLE_TABLE_ID environment variables');
  }

  const token = await getTenantAccessToken();
  const prompts: Prompt[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`
    );
    if (pageToken) {
      url.searchParams.set('page_token', pageToken);
    }
    url.searchParams.set('page_size', '100');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data: FeishuBitableResponse = await response.json();

    if (!response.ok || data.code !== 0) {
      console.error('Feishu API error details:', JSON.stringify(data, null, 2));
      throw new Error(`Feishu API error (${response.status}): ${data.msg || 'Unknown error'}`);
    }

    if (data.data?.items) {
      for (const item of data.data.items) {
        try {
          const prompt = transformRecord(item.record_id, item.fields);
          // Skip records with empty title
          if (prompt.title) {
            prompts.push(prompt);
          }
        } catch (e) {
          // Log and skip invalid records
          console.error('Failed to transform record:', item.record_id, e);
        }
      }
    }

    pageToken = data.data?.has_more ? data.data.page_token : undefined;
  } while (pageToken);

  return prompts;
}

/**
 * 从 Prompt 列表中提取所有分类
 */
export function extractCategories(prompts: Prompt[]): string[] {
  const categorySet = new Set<string>();
  for (const prompt of prompts) {
    if (prompt.category) {
      categorySet.add(prompt.category);
    }
  }
  return Array.from(categorySet).sort();
}
