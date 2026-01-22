import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';

function filterDataByDateRange(data: any[], startDate?: string, endDate?: string, dateColumn: string = 'Created Time') {
  if (!startDate && !endDate) return data;

  return data.filter((row) => {
    const rowDate = row[dateColumn];
    if (!rowDate) return false;
    
    // Skip jika cuma tab atau whitespace
    if (typeof rowDate === 'string' && rowDate.trim() === '') return false;

    let dateString = ''; // Format: YYYY-MM-DD
    
    try {
      if (typeof rowDate === 'string' && rowDate.includes('T') && rowDate.includes('Z')) {
        // Format ISO 8601 UTC: 2026-01-10T01:03:39.000Z
        // Convert ke WIB (UTC+7) dulu
        const utcDate = new Date(rowDate);
        
        // Tambah 7 jam untuk WIB
        const wibTime = utcDate.getTime() + (7 * 60 * 60 * 1000);
        const wibDate = new Date(wibTime);
        
        // Extract tanggal WIB
        const year = wibDate.getUTCFullYear();
        const month = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(wibDate.getUTCDate()).padStart(2, '0');
        
        dateString = `${year}-${month}-${day}`;
        
      } else if (typeof rowDate === 'string' && rowDate.includes('/')) {
        // Format: DD/MM/YYYY -> convert ke YYYY-MM-DD
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
        // Format: YYYY-MM-DD (sudah sesuai)
        dateString = rowDate;
      } else {
        return false;
      }

      // Simple string comparison
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
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const dateColumn = searchParams.get('dateColumn') || 'Created Time';

    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        { error: 'GOOGLE_APPS_SCRIPT_URL not configured' },
        { status: 500 }
      );
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

    const allData = result.data || [];
    const filteredData = filterDataByDateRange(allData, startDate, endDate, dateColumn);

    return NextResponse.json({
      data: filteredData,
    });
  } catch (error: any) {
    console.error('Error fetching data for export:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}