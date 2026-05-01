import { notFound } from 'next/navigation';
import EventDetailClient from './EventDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const res = await fetch(`${base}/api/events/by-slug/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function getStory(slug: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const res = await fetch(`${base}/api/events/by-slug/${slug}/story`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.story ?? null;
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const [event, story] = await Promise.all([getEvent(slug), getStory(slug)]);
  if (!event || event.error) notFound();
  return <EventDetailClient event={event} story={story} />;
}
