import { type NextRequest, NextResponse } from 'next/server';
import { mockDataStore } from '@/lib/mock-data-store';
import { aiAnalyzer } from '@/lib/ai-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = mockDataStore.getEventById(params.id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, requestAnalysis } = await request.json();

    let aiAnalysis: string | undefined;
    if (requestAnalysis) {
      const event = mockDataStore.getEventById(params.id);
      if (event) {
        const analysis = await aiAnalyzer.analyzeSecurityEvent(event);
        aiAnalysis = JSON.stringify(analysis);
      }
    }

    const success = mockDataStore.updateEventStatus(params.id, status, aiAnalysis);

    if (!success) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const updatedEvent = mockDataStore.getEventById(params.id);
    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

