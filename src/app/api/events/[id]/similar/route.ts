import { type NextRequest, NextResponse } from 'next/server';
import { mockDataStore } from '@/lib/mock-data-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const threshold = Number.parseFloat(searchParams.get('threshold') || '0.7');
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    const targetEvent = mockDataStore.getEventById(params.id);

    if (!targetEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const similarEvents = mockDataStore.searchSimilarEvents(targetEvent, threshold, limit);

    return NextResponse.json({
      targetEvent: {
        id: targetEvent.id,
        description: targetEvent.description,
        event_type: targetEvent.event_type,
        severity: targetEvent.severity
      },
      similarEvents: similarEvents.map(event => ({
        id: event.id,
        description: event.description,
        event_type: event.event_type,
        severity: event.severity,
        timestamp: event.timestamp,
        source_ip: event.source_ip
      })),
      threshold,
      count: similarEvents.length
    });
  } catch (error) {
    console.error('Error finding similar events:', error);
    return NextResponse.json(
      { error: 'Failed to find similar events' },
      { status: 500 }
    );
  }
}

