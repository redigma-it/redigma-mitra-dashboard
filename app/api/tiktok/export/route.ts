import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || '';

export async function GET() {
    try {
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

        return NextResponse.json({
            data: result.data,
            totalRows: result.data.length,
        });
    } catch (error: any) {
        console.error('Error fetching data for export:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch data' },
            { status: 500 }
        );
    }
}