import { type NextRequest, NextResponse } from 'next/server';
import { mockDataStore } from '@/lib/mock-data-store';
import { dataGenerator } from '@/lib/data-generator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const offset = Number.parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');

    let events = mockDataStore.getEvents(1000, 0); // Get all for filtering

    // Apply filters
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    if (eventType) {
      events = events.filter(event => event.event_type === eventType);
    }
    if (status) {
      events = events.filter(event => event.status === status);
    }

    // Apply pagination after filtering
    const paginatedEvents = events.slice(offset, offset + limit);

    return NextResponse.json({
      events: paginatedEvents,
      total: events.length,
      hasMore: offset + limit < events.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...eventData } = body;

    if (action === 'generate') {
      // Generate a new random event
      const newEvent = dataGenerator.generateRandomEvent();
      const id = await mockDataStore.addEvent(newEvent);
      const event = mockDataStore.getEventById(id);

      return NextResponse.json({ event });
    } else {
      // Create a custom event
      const id = await mockDataStore.addEvent(eventData);
      const event = mockDataStore.getEventById(id);

      return NextResponse.json({ event });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

