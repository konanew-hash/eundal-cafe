import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng parameters are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude format' },
        { status: 400 }
      );
    }

    // 서버 사이드에서 Nominatim 호출 (User-Agent 포함하여 CORS 및 차단 방지)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=ko`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let address = '';
    let roadAddress = '';
    let jibunAddress = '';
    let buildingName = '';
    let rawData: any = null;

    try {
      const res = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EundalCafeOrderSystem/1.0 (cafe.eundal.app@gmail.com)',
          'Accept-Language': 'ko,en;q=0.9',
        },
        next: { revalidate: 3600 },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        rawData = await res.json();
        const a = rawData.address || {};

        const province = a.province || a.city || a.state || '';
        const city = a.city && a.city !== province ? a.city : (a.county || a.district || '');
        const borough = a.borough || a.suburb || a.city_district || '';
        const road = a.road || '';
        const houseNumber = a.house_number || '';
        const quarter = a.quarter || a.neighbourhood || '';
        buildingName = a.amenity || a.building || a.shop || a.leisure || '';

        // 도로명 주소 조합
        if (road) {
          roadAddress = `${province} ${city} ${borough} ${road} ${houseNumber}`.replace(/\s+/g, ' ').trim();
        }

        // 지번 주소 조합
        if (quarter) {
          jibunAddress = `${province} ${city} ${borough} ${quarter} ${houseNumber}`.replace(/\s+/g, ' ').trim();
        }

        address = roadAddress || jibunAddress || rawData.display_name?.split(',').slice(0, 4).reverse().join(' ').trim() || '';
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.warn('Reverse geocoding fetch timeout or network error:', fetchErr);
    }

    // fallback: 주소를 못 찾았거나 네트워크 문제 시 좌표 기반 라벨
    if (!address) {
      address = `GPS 좌표 (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
    }

    return NextResponse.json({
      success: true,
      address,
      roadAddress: roadAddress || address,
      jibunAddress: jibunAddress || address,
      buildingName,
      lat: latitude,
      lng: longitude,
    });
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode location', message: error?.message },
      { status: 500 }
    );
  }
}
