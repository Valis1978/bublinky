'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Activity, BookOpen, Gamepad2, MessageCircle,
  CheckSquare, Clock, TrendingUp, Eye, Smartphone, Battery,
} from 'lucide-react';
import Link from 'next/link';

interface ActivityEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  created_at: string;
}

interface DashboardStats {
  todayOpens: number;
  todayMinutes: number;
  todayGames: number;
  todayLessons: number;
  todayMessages: number;
  todayTasks: number;
  weekStreak: number;
}

const EVENT_ICONS: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  app_open: { icon: Smartphone, color: '#8B5CF6', label: 'Otevřela appku' },
  page_visit: { icon: Eye, color: '#60A5FA', label: 'Navštívila' },
  game_start: { icon: Gamepad2, color: '#F472B6', label: 'Hrála' },
  game_end: { icon: Gamepad2, color: '#34D399', label: 'Dohrála' },
  learn_start: { icon: BookOpen, color: '#FBBF24', label: 'Začala učení' },
  learn_end: { icon: BookOpen, color: '#34D399', label: 'Dokončila učení' },
  chat_message: { icon: MessageCircle, color: '#A78BFA', label: 'Poslala zprávu' },
  task_complete: { icon: CheckSquare, color: '#34D399', label: 'Splnila úkol' },
  app_background: { icon: Clock, color: '#6B7280', label: 'Zavřela appku' },
};

function getPageName(path: string): string {
  const map: Record<string, string> = {
    '/': 'Domů', '/chat': 'Chat', '/games': 'Hry', '/learn': 'Učení',
    '/tasks': 'Úkoly', '/profile': 'Profil',
    '/games/tictactoe': 'Piškvorky', '/games/memory': 'Pexeso',
    '/games/minesweeper': 'Miny', '/games/wordle': 'Slovo dne',
    '/games/puzzle2048': '2048', '/games/snake': 'Had',
    '/games/emoji-quiz': 'Emoji kvíz', '/games/ai-quiz': 'AI Kvíz',
    '/learn/czech': 'Čeština', '/learn/math': 'Matika',
    '/learn/geography': 'Vlastivěda', '/learn/science': 'Přírodověda',
  };
  return map[path] || path;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'právě teď';
  if (mins < 60) return `před ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours}h`;
  const days = Math.floor(hours / 24);
  return `před ${days}d`;
}

export default function ParentDashboard() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [lastLocation, setLastLocation] = useState<Location | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Find child user ID
  useEffect(() => {
    // In a real app, this would come from a parent-child relationship table
    // For now, we find the child user from the users API
    const fetchChildId = async () => {
      try {
        const res = await fetch('/api/auth/users?role=child');
        const data = await res.json();
        if (data && data.length > 0) {
          setChildId(data[0].id);
        }
      } catch {
        // Fallback: try localStorage
        try {
          const users = localStorage.getItem('bub_users_cache');
          if (users) {
            const parsed = JSON.parse(users);
            const child = parsed.find((u: { role: string }) => u.role === 'child');
            if (child) setChildId(child.id);
          }
        } catch { /* ignore */ }
      }
    };
    fetchChildId();
  }, []);

  const fetchData = useCallback(async () => {
    if (!childId) return;
    setLoading(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [actRes, locRes] = await Promise.all([
        fetch(`/api/activity?userId=${childId}&limit=100&since=${todayISO}`),
        fetch(`/api/location?userId=${childId}&limit=1`),
      ]);

      const actData: ActivityEvent[] = await actRes.json();
      const locData: Location[] = await locRes.json();

      setActivities(Array.isArray(actData) ? actData : []);
      setLastLocation(Array.isArray(locData) && locData.length > 0 ? locData[0] : null);

      // Compute stats
      if (Array.isArray(actData)) {
        const todayEvents = actData.filter(e => new Date(e.created_at) >= today);
        setStats({
          todayOpens: todayEvents.filter(e => e.event_type === 'app_open').length,
          todayMinutes: Math.round(
            todayEvents
              .filter(e => e.event_data?.duration_sec)
              .reduce((sum, e) => sum + (Number(e.event_data.duration_sec) || 0), 0) / 60
          ),
          todayGames: todayEvents.filter(e => e.event_type === 'game_start').length,
          todayLessons: todayEvents.filter(e => e.event_type === 'learn_end').length,
          todayMessages: todayEvents.filter(e => e.event_type === 'chat_message').length,
          todayTasks: todayEvents.filter(e => e.event_type === 'task_complete').length,
          weekStreak: 0, // TODO: compute from bub_user_stats
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-lg border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">Viki Dashboard</h1>
            <p className="text-xs text-gray-500">
              {loading ? 'Načítám...' : `Aktualizováno ${new Date().toLocaleTimeString('cs')}`}
            </p>
          </div>
          <button onClick={fetchData} className="ml-auto p-2 rounded-xl hover:bg-gray-800">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Otevření', value: stats.todayOpens, icon: Smartphone, color: '#8B5CF6' },
              { label: 'Minut', value: stats.todayMinutes, icon: Clock, color: '#60A5FA' },
              { label: 'Hry', value: stats.todayGames, icon: Gamepad2, color: '#F472B6' },
              { label: 'Učení', value: stats.todayLessons, icon: BookOpen, color: '#FBBF24' },
              { label: 'Zprávy', value: stats.todayMessages, icon: MessageCircle, color: '#A78BFA' },
              { label: 'Úkoly', value: stats.todayTasks, icon: CheckSquare, color: '#34D399' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 rounded-2xl p-3 border border-gray-800"
                >
                  <Icon className="w-4 h-4 mb-1" style={{ color: stat.color }} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Last Location */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-red-400" />
            <h2 className="font-bold">Poslední poloha</h2>
          </div>
          {lastLocation ? (
            <div>
              <a
                href={`https://maps.google.com/?q=${lastLocation.latitude},${lastLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm underline"
              >
                📍 Otevřít v mapě
              </a>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{timeAgo(lastLocation.created_at)}</span>
                {lastLocation.accuracy && <span>±{Math.round(lastLocation.accuracy)}m</span>}
                {lastLocation.battery_level && (
                  <span className="flex items-center gap-1">
                    <Battery className="w-3 h-3" /> {lastLocation.battery_level}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Zatím žádná poloha</p>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Dnešní aktivita
          </h2>
          {activities.length === 0 && !loading ? (
            <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-800">
              <p className="text-gray-500">Dnes zatím žádná aktivita</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 30).map((event) => {
                const config = EVENT_ICONS[event.event_type] || EVENT_ICONS.app_open;
                const Icon = config.icon;
                const page = event.event_data?.page as string | undefined;
                const duration = event.event_data?.duration_sec as number | undefined;
                const score = event.event_data?.score as number | undefined;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${config.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {config.label}
                        {page && <span className="text-gray-400"> — {getPageName(page)}</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{timeAgo(event.created_at)}</span>
                        {duration && duration > 0 && <span>· {duration}s</span>}
                        {score !== undefined && <span>· skóre: {score}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
