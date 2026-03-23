'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Wind, Droplets, Eye, Thermometer, Sunrise, Sunset } from 'lucide-react';
import Link from 'next/link';

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  visibility: number;
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

// Cute weather emoji mapping
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

function getWeatherAdvice(temp: number, icon: string): string {
  if (icon.startsWith('13')) return '❄️ Brrr! Vezmi si čepici a rukavice!';
  if (icon.startsWith('11')) return '⚡ Bouřka! Zůstaň radši doma.';
  if (icon.startsWith('09') || icon.startsWith('10')) return '🌂 Nezapomeň deštník!';
  if (temp > 28) return '🧴 Hodně pij a namaž se opalovacím!';
  if (temp > 20) return '😎 Krásný den na výlet!';
  if (temp > 10) return '🧥 Vezmi si bundu, je chladněji.';
  if (temp > 0) return '🧣 Oblékni se teple!';
  return '🥶 Mrzne! Oblékni se jako cibule!';
}

function getDayName(dateStr: string): string {
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Default to Brno if no geolocation
        let lat = 49.1951;
        let lon = 16.6068;

        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          // Use Brno default
        }

        const API_KEY = '0c8e4964238f3bdfa41eb7f25f7ba073'; // Free tier OWM
        const [currentRes, forecastRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=cz`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=cz`),
        ]);

        if (!currentRes.ok || !forecastRes.ok) throw new Error('API chyba');

        const current = await currentRes.json();
        const forecast = await forecastRes.json();

        // Process 5-day forecast (take noon readings)
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

        setWeather({
          temp: Math.round(current.main.temp),
          feelsLike: Math.round(current.main.feels_like),
          description: current.weather[0].description,
          icon: current.weather[0].icon,
          humidity: current.main.humidity,
          wind: Math.round(current.wind.speed * 3.6),
          visibility: Math.round(current.visibility / 1000),
          city: current.name,
          sunrise: sunriseTime,
          sunset: sunsetTime,
          forecast: Array.from(dailyMap.values()).slice(0, 5),
        });
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
          <Link href="/" className="p-1" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            🌤️ Počasí
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div
              className="text-5xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              🌤️
            </motion.div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Načítám počasí...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-6">
            <p className="text-4xl mb-4">😢</p>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        ) : weather ? (
          <div className="p-4 max-w-lg mx-auto space-y-4">
            {/* Current weather — hero card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #F59E0B)',
                color: 'white',
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-2 opacity-90">
                <MapPin size={14} />
                <span className="text-sm font-medium">{weather.city}</span>
              </div>

              <motion.div
                className="text-6xl my-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {getWeatherEmoji(weather.icon)}
              </motion.div>

              <p className="text-5xl font-black">{weather.temp}°</p>
              <p className="text-sm opacity-90 capitalize mt-1">{weather.description}</p>
              <p className="text-xs opacity-75 mt-1">Pocitově {weather.feelsLike}°</p>
            </motion.div>

            {/* Advice */}
            <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {getWeatherAdvice(weather.temp, weather.icon)}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Wind size={18} />, label: 'Vítr', value: `${weather.wind} km/h` },
                { icon: <Droplets size={18} />, label: 'Vlhkost', value: `${weather.humidity}%` },
                { icon: <Eye size={18} />, label: 'Viditelnost', value: `${weather.visibility} km` },
                { icon: <Thermometer size={18} />, label: 'Pocitově', value: `${weather.feelsLike}°C` },
                { icon: <Sunrise size={18} />, label: 'Východ ☀️', value: weather.sunrise },
                { icon: <Sunset size={18} />, label: 'Západ 🌅', value: weather.sunset },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <div style={{ color: 'var(--accent)' }}>{item.icon}</div>
                  <div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 5-day forecast */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                📅 Předpověď
              </h3>
              <div className="space-y-3">
                {weather.forecast.map((day, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium w-16" style={{ color: 'var(--text-primary)' }}>
                      {day.day}
                    </span>
                    <span className="text-xl">{getWeatherEmoji(day.icon)}</span>
                    <span className="text-xs capitalize flex-1 mx-3 truncate" style={{ color: 'var(--text-muted)' }}>
                      {day.description}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{day.tempMax}°</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{day.tempMin}°</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
