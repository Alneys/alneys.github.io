import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/version.json', ({ request }) => {
    const url = new URL(request.url);
    const t = url.searchParams.get('t') ?? String(Date.now());
    const ts = new Date(Number(t));

    return HttpResponse.json({
      buildId: `mock_dev_${t}`,
      publishedAt: ts.toISOString(),
    });
  }),
];
