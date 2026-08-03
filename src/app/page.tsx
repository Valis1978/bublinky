import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

export default async function Home() {
  const token = (await cookies()).get('bub_session')?.value;
  const session = token ? await verifySession(token) : null;
  // Parents land in chat, Viki lands in her Domeček
  redirect(session?.role === 'parent' ? '/chat' : '/home');
}
