import { NextRequest, NextResponse } from 'next/server';

// Open-Meteo API — free, no API key needed
const BASE = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather Code to description + icon
function weatherCodeToInfo(code: number, isDay = true): { description: string; icon: string } {
  const map: Record<number, { desc: string; day: string; night: string }> = {
    0: { desc: 'Jasno', day: '01d', night: '01n' },
    1: { desc: 'Převážně jasno', day: '02d', night: '02n' },
    2: { desc: 'Polojasno', day: '03d', night: '03n' },
    3: { desc: 'Zataženo', day: '04d', night: '04n' },
    45: { desc: 'Mlha', day: '50d', night: '50n' },
    48: { desc: 'Námraza', day: '50d', night: '50n' },
    51: { desc: 'Mrholení', day: '09d', night: '09n' },
    53: { desc: 'Mrholení', day: '09d', night: '09n' },
    55: { desc: 'Silné mrholení', day: '09d', night: '09n' },
    61: { desc: 'Déšť', day: '10d', night: '10n' },
    63: { desc: 'Déšť', day: '10d', night: '10n' },
    65: { desc: 'Silný déšť', day: '10d', night: '10n' },
    71: { desc: 'Sněžení', day: '13d', night: '13n' },
    73: { desc: 'Sněžení', day: '13d', night: '13n' },
    75: { desc: 'Husté sněžení', day: '13d', night: '13n' },
    77: { desc: 'Sněhové zrno', day: '13d', night: '13n' },
    80: { desc: 'Přeháňky', day: '09d', night: '09n' },
    81: { desc: 'Přeháňky', day: '09d', night: '09n' },
    82: { desc: 'Silné přeháňky', day: '09d', night: '09n' },
    85: { desc: 'Sněhové přeháňky', day: '13d', night: '13n' },
    86: { desc: 'Silné sněhové přeháňky', day: '13d', night: '13n' },
    95: { desc: 'Bouřka', day: '11d', night: '11n' },
    96: { desc: 'Bouřka s kroupami', day: '11d', night: '11n' },
    99: { desc: 'Silná bouřka', day: '11d', night: '11n' },
  };
  const info = map[code] || { desc: 'Neznámé', day: '03d', night: '03n' };
  return { description: info.desc, icon: isDay ? info.day : info.night };
}

// Reverse geocode to get city name
async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'Bublinky/1.0' }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || 'Brno';
    }
  } catch { /* timeout or error — fallback */ }
  return 'Brno';
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat') || '49.1951';
  const lon = req.nextUrl.searchParams.get('lon') || '16.6068';

  try {
    const [meteoRes, city] = await Promise.all([
      fetch(
        `${BASE}?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
        `&timezone=Europe/Prague&forecast_days=6`,
        { next: { revalidate: 600 } }
      ),
      getCityName(parseFloat(lat), parseFloat(lon)),
    ]);

    if (!meteoRes.ok) {
      return NextResponse.json(
        { success: false, error: `Open-Meteo error: ${meteoRes.status}` },
        { status: 502 }
      );
    }

    const meteo = await meteoRes.json();
    const now = new Date();
    const isDay = now.getHours() >= 6 && now.getHours() < 20;
    const currentWeather = weatherCodeToInfo(meteo.current.weather_code, isDay);

    // Format as compatible response
    const current = {
      main: {
        temp: meteo.current.temperature_2m,
        feels_like: meteo.current.apparent_temperature,
        humidity: meteo.current.relative_humidity_2m,
      },
      weather: [{ description: currentWeather.description, icon: currentWeather.icon }],
      wind: { speed: meteo.current.wind_speed_10m / 3.6 }, // km/h → m/s
      visibility: 10000,
      name: city,
      sys: {
        sunrise: new Date(meteo.daily.sunrise[0]).getTime() / 1000,
        sunset: new Date(meteo.daily.sunset[0]).getTime() / 1000,
      },
    };

    // Build 5-day forecast compatible with OWM format
    const forecastList = meteo.daily.time.slice(1).map((date: string, i: number) => {
      const dayWeather = weatherCodeToInfo(meteo.daily.weather_code[i + 1], true);
      return {
        dt_txt: `${date} 12:00:00`,
        main: {
          temp_max: meteo.daily.temperature_2m_max[i + 1],
          temp_min: meteo.daily.temperature_2m_min[i + 1],
        },
        weather: [{ description: dayWeather.description, icon: dayWeather.icon }],
      };
    });

    return NextResponse.json({
      success: true,
      current,
      forecast: { list: forecastList },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
