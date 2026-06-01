import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/coach/clients', () => {
    return HttpResponse.json({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, per_page: 20, total_pages: 1 },
    });
  }),

  http.post('*/auth/coach/login', async ({ request }) => {
    const body = (await request.json()) as { email: string };
    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'mock_token',
        coach: { id: '1', name: 'Test', email: body.email, subscription_status: 'active' },
      },
    });
  }),

  http.post('*/auth/coach/register', async () => {
    return HttpResponse.json({
      success: true,
      data: { id: 'new-coach-id', setup_token: 'mock-setup-token' },
    }, { status: 201 });
  }),
];
