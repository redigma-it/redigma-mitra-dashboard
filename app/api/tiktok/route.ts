import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';

let cachedData: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchAllData(forceRefresh: boolean = false) {
  const now = Date.now();


  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Returning cached data');
    return cachedData;
  }

  console.log('Fetching fresh data from Google Sheets');
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  cachedData = result.data || [];
  cacheTimestamp = now;

  return cachedData;
}

function filterDataByDateRange(data: any[], startDate?: string, endDate?: string, dateColumn: string = 'Created Time') {
  if (!startDate && !endDate) return data;

  return data.filter((row) => {
    const rowDate = row[dateColumn];
    if (!rowDate) return false;

    if (typeof rowDate === 'string' && rowDate.trim() === '') return false;

    let dateString = '';

    try {
      if (typeof rowDate === 'string' && rowDate.includes('T') && rowDate.includes('Z')) {
        const utcDate = new Date(rowDate);
        const wibTime = utcDate.getTime() + (7 * 60 * 60 * 1000);
        const wibDate = new Date(wibTime);
        const year = wibDate.getUTCFullYear();
        const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(wibDate.getUTCDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;

      } else if (typeof rowDate === 'string' && rowDate.includes('/')) {
        const parts = rowDate.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          dateString = `${year}-${month}-${day}`;
        } else {
          return false;
        }
      } else if (typeof rowDate === 'string' && rowDate.includes('-') && !rowDate.includes('T')) {
        dateString = rowDate;
      } else {
        return false;
      }

      if (startDate && endDate) {
        return dateString >= startDate && dateString <= endDate;
      } else if (startDate) {
        return dateString >= startDate;
      } else if (endDate) {
        return dateString <= endDate;
      }

      return true;
    } catch (error) {
      console.error('Date parsing error for value:', rowDate, error);
      return false;
    }
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const dateColumn = searchParams.get('dateColumn') || 'Created Time';
    const clearCache = searchParams.get('clearCache') === 'true';

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'GOOGLE_APPS_SCRIPT_URL not configured' },
        { status: 500 }
      );
    }


    const allData = await fetchAllData(clearCache);

    if (!allData) {
      return NextResponse.json({
        data: [],
        page,
        hasMore: false,
        totalRows: 0,
        totalShown: 0,
      });
    }

    const filteredData = filterDataByDateRange(allData, startDate, endDate, dateColumn);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredData.length;

    return NextResponse.json({
      data: paginatedData,
      page,
      hasMore,
      totalRows: filteredData.length,
      totalShown: paginatedData.length,
      filters: {
        startDate,
        endDate,
        dateColumn,
      },
      cacheCleared: clearCache,
    });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}