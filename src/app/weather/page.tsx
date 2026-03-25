'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Wind, Droplets, Thermometer, Sunrise, Sunset } from 'lucide-react';
import Link from 'next/link';

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  city: string;
  sunrise: string;
  sunset: string;
  forecast: ForecastDay[];
}

interface ForecastDay {
  day: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  description: string;
}

interface AIAdvice {
  outfit: string;
  tip: string;
  mood: string;
  funFact: string;
}

function getWeatherEmoji(icon: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[icon] || '🌤️';
}

function getWeatherGradient(icon: string, temp: number): string {
  if (icon.startsWith('01') && temp > 20) return 'linear-gradient(135deg, #FF6B35, #F7C948)';
  if (icon.startsWith('01')) return 'linear-gradient(135deg, #4A90D9, #87CEEB)';
  if (icon.startsWith('02') || icon.startsWith('03')) return 'linear-gradient(135deg, #6B8DD6, #8E9EAB)';
  if (icon.startsWith('04')) return 'linear-gradient(135deg, #616D7E, #9BA8B0)';
  if (icon.startsWith('09') || icon.startsWith('10')) return 'linear-gradient(135deg, #4B6CB7, #182848)';
  if (icon.startsWith('11')) return 'linear-gradient(135deg, #2C3E50, #4A0E4E)';
  if (icon.startsWith('13')) return 'linear-gradient(135deg, #E8EAF6, #B0BEC5)';
  if (icon.startsWith('50')) return 'linear-gradient(135deg, #9E9E9E, #BDBDBD)';
  return 'linear-gradient(135deg, #4A90D9, #F7C948)';
}

function getDayName(dateStr: string): string {
  const days = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Dnes';
  if (d.toDateString() === tomorrow.toDateString()) return 'Zítra';
  return days[d.getDay()];
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchWeather() {
      try {
        let lat = 49.1951;
        let lon = 16.6068;

        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch { /* Brno default */ }

        const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!weatherRes.ok) throw new Error('API chyba');
        const weatherData = await weatherRes.json();
        if (!weatherData.success) throw new Error(weatherData.error || 'API chyba');
        const { current, forecast } = weatherData;

        const dailyMap = new Map<string, ForecastDay>();
        for (const item of forecast.list) {
          const date = item.dt_txt.split(' ')[0];
          const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
          if (!dailyMap.has(date) || hour === 12) {
            dailyMap.set(date, {
              day: getDayName(date),
              icon: item.weather[0].icon,
              tempMax: Math.round(item.main.temp_max),
              tempMin: Math.round(item.main.temp_min),
              description: item.weather[0].description,
            });
          }
        }

        const sunriseTime = new Date(current.sys.sunrise * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        const sunsetTime = new Date(current.sys.sunset * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

        const forecastDays = Array.from(dailyMap.values()).slice(0, 5);

        const w: WeatherData = {
          temp: Math.round(current.main.temp),
          feelsLike: Math.round(current.main.feels_like),
          description: current.weather[0].description,
          icon: current.weather[0].icon,
          humidity: current.main.humidity,
          wind: Math.round(current.wind.speed * 3.6),
          city: current.name,
          sunrise: sunriseTime,
          sunset: sunsetTime,
          forecast: forecastDays,
        };
        setWeather(w);

        // Fetch AI advice
        setAdviceLoading(true);
        try {
          const forecastStr = forecastDays.map(d => `${d.day}: ${d.tempMax}°/${d.tempMin}° ${d.description}`).join(', ');
          const advRes = await fetch('/api/weather/advice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              temp: w.temp,
              feelsLike: w.feelsLike,
              description: w.description,
              humidity: w.humidity,
              wind: w.wind,
              city: w.city,
              forecast: forecastStr,
            }),
          });
          const advData = await advRes.json();
          if (advData.success) setAdvice(advData.advice);
        } catch { /* AI advice is optional */ }
        setAdviceLoading(false);
      } catch (err) {
        setError('Nepodařilo se načíst počasí 😢');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto pb-nav safe-top">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
          style={{
            background: 'var(--bg-nav)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Link href="/profile" className="p-1" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            🌤️ Počasí
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div
              className="text-6xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              🌤️
            </motion.div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Koukám z okna...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-6">
            <p className="text-5xl mb-4">😢</p>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        ) : weather ? (
          <div className="p-4 max-w-lg mx-auto space-y-4">
            {/* Hero card — dynamic gradient based on weather */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-6 text-center relative overflow-hidden"
              style={{ background: getWeatherGradient(weather.icon, weather.temp), color: 'white' }}
            >
              <div className="flex items-center justify-center gap-1 mb-1 opacity-90">
                <MapPin size={14} />
                <span className="text-sm font-medium">{weather.city}</span>
              </div>

              <motion.div
                className="text-7xl my-3"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {getWeatherEmoji(weather.icon)}
              </motion.div>

              <p className="text-6xl font-black tracking-tight">{weather.temp}°</p>
              <p className="text-sm opacity-90 capitalize mt-1">{weather.description}</p>
              <p className="text-xs opacity-75 mt-1">Pocitově {weather.feelsLike}°C</p>

              {/* Quick stats row */}
              <div className="flex justify-center gap-6 mt-4 opacity-80 text-xs">
                <span>💨 {weather.wind} km/h</span>
                <span>💧 {weather.humidity}%</span>
                <span>🌅 {weather.sunrise}</span>
                <span>🌇 {weather.sunset}</span>
              </div>
            </motion.div>

            {/* AI Advice — outfit + tip */}
            <AnimatePresence>
              {adviceLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <motion.span
                    className="text-2xl inline-block"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🤔
                  </motion.span>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>AI přemýšlí co na sebe...</p>
                </motion.div>
              ) : advice ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Outfit recommendation */}
                  <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{advice.mood}</span>
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>👗 Co si obléct</p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{advice.outfit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity tip */}
                  <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>💡 Tip na dnešek</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{advice.tip}</p>
                  </div>

                  {/* Fun fact */}
                  <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>🧠 Věděla jsi?</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{advice.funFact}</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Wind size={16} />, label: 'Vítr', value: `${weather.wind} km/h`, emoji: '💨' },
                { icon: <Droplets size={16} />, label: 'Vlhkost', value: `${weather.humidity}%`, emoji: '💧' },
                { icon: <Thermometer size={16} />, label: 'Pocitově', value: `${weather.feelsLike}°C`, emoji: '🌡️' },
                { icon: <Sunrise size={16} />, label: 'Východ', value: weather.sunrise, emoji: '🌅' },
                { icon: <Sunset size={16} />, label: 'Západ', value: weather.sunset, emoji: '🌇' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 5-day forecast */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            >
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                📅 Dalších 5 dní
              </h3>
              <div className="space-y-3">
                {weather.forecast.map((day, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold w-12" style={{ color: 'var(--text-primary)' }}>
                      {day.day}
                    </span>
                    <span className="text-xl w-8 text-center">{getWeatherEmoji(day.icon)}</span>
                    <span className="text-xs capitalize flex-1 mx-2 truncate" style={{ color: 'var(--text-muted)' }}>
                      {day.description}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{day.tempMax}°</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{day.tempMin}°</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
