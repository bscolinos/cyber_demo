import { NextResponse } from 'next/server';
import { mockDataStore } from '@/lib/mock-data-store';

export async function GET() {
  try {
    const stats = mockDataStore.getStats();
    const topThreats = mockDataStore.getTopThreats(5);
    const recentActivity = mockDataStore.getRecentActivity(24);

    return NextResponse.json({
      ...stats,
      topThreats,
      recentActivityCount: recentActivity.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
