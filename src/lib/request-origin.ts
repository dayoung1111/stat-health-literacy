import 'server-only';

import { headers } from 'next/headers';

// 지금 요청이 https로 들어왔는지. Vercel처럼 https면 로그인 쿠키에 Secure를 붙이고,
// 시연 때 맥에서 같은 와이파이 주소(http://192.168.…:3000)로 열면 붙이지 않는다.
// (Secure 쿠키는 https가 아닌 주소에서는 브라우저가 버려서, 휴대폰 시연에서 로그인이 풀린다.)
export async function isHttpsRequest() {
  const h = await headers();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return proto === 'https';
}
