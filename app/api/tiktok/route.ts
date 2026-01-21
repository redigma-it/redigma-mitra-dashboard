import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';


let cachedData: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; 

async function fetchAllData() {
  const now = Date.now();
  
  
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }
  
  
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  
  cachedData = result.data;
  cacheTimestamp = now;
  
  return cachedData;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'GOOGLE_APPS_SCRIPT_URL not configured' },
        { status: 500 }
      );
    }

    
    const allData = await fetchAllData();
    
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = allData.slice(startIndex, endIndex);
    const hasMore = endIndex < allData.length;

    return NextResponse.json({
      data: paginatedData,
      page,
      hasMore,
      totalRows: allData.length,
      totalShown: paginatedData.length,
    });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}