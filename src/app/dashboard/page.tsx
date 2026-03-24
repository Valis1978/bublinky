'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Activity, Clock, Smartphone,
  BookOpen, Gamepad2, MessageCircle, TrendingUp, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
}

const eventIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  app_open: { icon: <Smartphone size={16} />, label: 'Otevřela appku', color: '#60a5fa' },
  page_visit: { icon: <Activity size={16} />, label: 'Navštívila', color: '#a78bfa' },
  app_background: { icon: <Clock size={16} />, label: 'Zavřela appku', color: '#94a3b8' },
  quiz_complete: { icon: <BookOpen size={16} />, label: 'Dokončila kvíz', color: '#34d399' },
  game_play: { icon: <Gamepad2 size={16} />, label: 'Hrála hru', color: '#f472b6' },
  message_sent: { icon: <MessageCircle size={16} />, label: 'Poslala zprávu', color: '#38bdf8' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'právě teď';
  if (diffMin < 60) return `před ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `před ${diffHours}h`;

  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getPageName(page: string): string {
  const names: Record<string, string> = {
    '/chat': '💬 Chat',
    '/tasks': '📋 Úkoly',
    '/games': '🎮 Hry',
    '/learn': '📚 Učení',
    '/profile': '👤 Profil',
    '/pet': '🐾 Mazlíček',
    '/weather': '🌤️ Počasí',
    '/stories': '📖 Příběhy',
    '/diary': '📓 Deníček',
    '/games/ai-quiz': '🧠 AI Kvíz',
    '/games/memory': '🃏 Pexeso',
    '/games/snake': '🐍 Snake',
    '/games/wordle': '📝 Wordle',
    '/games/tictactoe': '⭕ Piškvorky',
    '/learn/math': '🔢 Matika',
    '/learn/czech': '📖 Čeština',
    '/learn/geography': '🌍 Zeměpis',
    '/learn/science': '🔬 Přírodověda',
  };
  return names[page] || page;
}

export default function DadDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);

  const fetchData = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [actRes, locRes] = await Promise.all([
        fetch(`/api/activity?userId=${cId}&limit=100&since=${since}`),
        fetch(`/api/activity/location?userId=${cId}&limit=50&since=${since}`),
      ]);
      const actData = await actRes.json();
      const locData = await locRes.json();
      setActivities(Array.isArray(actData) ? actData : []);
      setLocations(locData.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Find child user ID
  useEffect(() => {
    if (!user || user.role !== 'parent') return;
    fetch('/api/users?role=child')
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.id) {
          setChildId(data[0].id);
          fetchData(data[0].id);
        }
      })
      .catch(() => setLoading(false));
  }, [user, fetchData]);

  if (authLoading) return null;

  if (!user || user.role !== 'parent') {
    return (
      <div className="flex flex-col h-dvh items-center justify-center">
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>🔒 Přístup pouze pro rodiče</p>
        <BottomNav />
      </div>
    );
  }

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayActivities = activities.filter((a) => new Date(a.created_at) >= todayStart);
  const todayAppOpens = todayActivities.filter((a) => a.event_type === 'app_open').length;
  const todayPages = todayActivities.filter((a) => a.event_type === 'page_visit');
  const todayTimeSeconds = todayPages.reduce((sum, a) => sum + ((a.event_data?.duration_sec as number) || 0), 0);
  const todayTimeMinutes = Math.round(todayTimeSeconds / 60);
  const lastLocation = locations[0];
  const lastActivity = activities[0];

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 safe-top">
        <Link href="/profile">
          <ArrowLeft size={24} style={{ color: 'var(--text)' }} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          📊 Dashboard
        </h1>
        <button
          onClick={() => childId && fetchData(childId)}
          className="ml-auto p-2 rounded-xl"
          style={{ background: 'var(--accent-soft)' }}
        >
          <RefreshCw size={18} style={{ color: 'var(--accent)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-nav space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-3 border-t-transparent rounded-full"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <>
            {/* Today Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="📱" label="Otevření" value={String(todayAppOpens)} />
              <StatCard icon="⏱️" label="Čas" value={`${todayTimeMinutes}m`} />
              <StatCard icon="📄" label="Stránek" value={String(todayPages.length)} />
            </div>

            {/* Last Location */}
            {lastLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={18} style={{ color: '#ef4444' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Poslední poloha</h3>
                  <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatTime(lastLocation.created_at)}
                  </span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${lastLocation.latitude},${lastLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${lastLocation.latitude},${lastLocation.longitude}&zoom=15&size=600x200&markers=color:red%7C${lastLocation.latitude},${lastLocation.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}`}
                    alt="Mapa"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      // Fallback if Google Maps API fails
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    📍 {lastLocation.latitude.toFixed(4)}, {lastLocation.longitude.toFixed(4)}
                    {lastLocation.accuracy && ` (±${Math.round(lastLocation.accuracy)}m)`}
                    <br />
                    Klikni pro otevření v Google Maps
                  </div>
                </a>
              </motion.div>
            )}

            {/* Activity Feed */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Aktivita</h3>
              </div>

              {activities.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  Zatím žádná aktivita
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activities.slice(0, 30).map((a) => {
                    const info = eventIcons[a.event_type] || {
                      icon: <Activity size={16} />,
                      label: a.event_type,
                      color: '#94a3b8',
                    };
                    const page = a.event_data?.page as string;
                    const duration = a.event_data?.duration_sec as number;

                    return (
                      <div key={a.id} className="flex items-center gap-3 py-1.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${info.color}20`, color: info.color }}
                        >
                          {info.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                            {info.label}
                            {page && ` ${getPageName(page)}`}
                          </p>
                          {duration && duration > 0 && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {duration < 60 ? `${duration}s` : `${Math.round(duration / 60)}min`}
                            </p>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {formatTime(a.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Location History */}
            {locations.length > 1 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={18} style={{ color: '#ef4444' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Historie polohy</h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {locations.slice(0, 20).map((loc) => (
                    <a
                      key={loc.id}
                      href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-1.5"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: '#ef444420', color: '#ef4444' }}
                      >
                        <MapPin size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: 'var(--text)' }}>
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </p>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(loc.created_at)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Last seen */}
            {lastActivity && (
              <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)' }}>
                Naposledy viděna: {formatTime(lastActivity.created_at)}
              </p>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-3 text-center"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-lg font-bold mt-1" style={{ color: 'var(--text)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
}
