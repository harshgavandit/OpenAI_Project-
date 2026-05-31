import { test, expect } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:8000';
const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

test.describe('MemoryGraph proof journey', () => {
  test('register via API, seed memory, chat returns proofs', async ({ request }) => {
    const email = `e2e-${Date.now()}@memorygraph.ai`;
    const register = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: 'memorygraph-demo',
        full_name: 'E2E User',
      },
    });
    expect(register.ok()).toBeTruthy();
    const { access_token: token } = await register.json();

    const upload = await request.post(`${API_URL}/memories/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'family.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Grandfather visited Mumbai in 2015 during summer vacation.'),
        },
      },
    });
    expect(upload.ok()).toBeTruthy();
    const { memory_id: memoryId } = await upload.json();

    let status = 'pending';
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const statusRes = await request.get(`${API_URL}/memories/${memoryId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      status = (await statusRes.json()).status;
      if (status === 'completed' || status === 'failed') break;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    expect(status).toBe('completed');

    const chat = await request.post(`${API_URL}/chat`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { query: 'What happened in Mumbai?' },
    });
    expect(chat.ok()).toBeTruthy();
    const body = await chat.json();
    expect(body.answer).toBeTruthy();
    expect(Array.isArray(body.proofs)).toBeTruthy();
    expect(body.proofs.length).toBeGreaterThan(0);

    const timeMachine = await request.post(`${API_URL}/time-machine/query`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { query: 'Show summer vacation memories' },
    });
    expect(timeMachine.ok()).toBeTruthy();
  });

  test('marketing home loads', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
