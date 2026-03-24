import { NextRequest, NextResponse } from 'next/server';

const API_KEY = '0c8e4964238f3bdfa41eb7f25f7ba073';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat') || '49.1951';
  const lon = req.nextUrl.searchParams.get('lon') || '16.6068';

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=cz`,
        { next: { revalidate: 600 } } // cache 10 min
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=cz`,
        { next: { revalidate: 600 } }
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { success: false, error: `OWM API error: ${currentRes.status}` },
        { status: 502 }
      );
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    return NextResponse.json({ success: true, current, forecast });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
