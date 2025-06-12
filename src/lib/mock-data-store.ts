import type { SecurityEvent } from './database';
import { dataGenerator } from './data-generator';
import { aiAnalyzer } from './ai-service';
import { v4 as uuidv4 } from 'uuid';

class MockDataStore {
  private events: SecurityEvent[] = [];
  private isGenerating = false;

  constructor() {
    this.initializeWithSampleData();
  }

  private async initializeWithSampleData() {
    // Generate initial sample events
    const sampleEvents = dataGenerator.generateBatchEvents(50);

    for (const eventData of sampleEvents) {
      const event: SecurityEvent = {
        id: uuidv4(),
        ...eventData,
        // Add some variation to timestamps
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      };

      // Generate AI analysis for some events
      if (Math.random() > 0.3) {
        try {
          const analysis = await aiAnalyzer.analyzeSecurityEvent(event);
          event.ai_analysis = JSON.stringify(analysis);
          event.confidence_score = analysis.confidence_score;
        } catch (error) {
          console.error('Error generating AI analysis:', error);
        }
      }

      // Generate embedding for vector search
      if (Math.random() > 0.2) {
        try {
          const embeddingText = `${event.description} ${JSON.stringify(event.raw_data)}`;
          event.embedding = await aiAnalyzer.generateEmbedding(embeddingText);
        } catch (error) {
          console.error('Error generating embedding:', error);
        }
      }

      this.events.push(event);
    }

    // Sort by timestamp (newest first)
    this.events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async addEvent(eventData: Omit<SecurityEvent, 'id'>): Promise<string> {
    const event: SecurityEvent = {
      id: uuidv4(),
      ...eventData
    };

    // Generate AI analysis
    try {
      const analysis = await aiAnalyzer.analyzeSecurityEvent(event);
      event.ai_analysis = JSON.stringify(analysis);
      event.confidence_score = analysis.confidence_score;
    } catch (error) {
      console.error('Error generating AI analysis:', error);
    }

    // Generate embedding
    try {
      const embeddingText = `${event.description} ${JSON.stringify(event.raw_data)}`;
      event.embedding = await aiAnalyzer.generateEmbedding(embeddingText);
    } catch (error) {
      console.error('Error generating embedding:', error);
    }

    this.events.unshift(event); // Add to beginning (newest first)

    // Keep only last 1000 events for demo
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    return event.id;
  }

  getEvents(limit = 100, offset = 0): SecurityEvent[] {
    return this.events.slice(offset, offset + limit);
  }

  getEventById(id: string): SecurityEvent | undefined {
    return this.events.find(event => event.id === id);
  }

  updateEventStatus(id: string, status: SecurityEvent['status'], aiAnalysis?: string): boolean {
    const event = this.events.find(e => e.id === id);
    if (event) {
      event.status = status;
      if (aiAnalysis) {
        event.ai_analysis = aiAnalysis;
      }
      return true;
    }
    return false;
  }

  searchSimilarEvents(targetEvent: SecurityEvent, threshold = 0.8, limit = 10): SecurityEvent[] {
    if (!targetEvent.embedding) return [];

    const similarities = this.events
      .filter(event => event.embedding && event.id !== targetEvent.id)
      .map(event => ({
        event,
        similarity: this.cosineSimilarity(targetEvent.embedding!, event.embedding!)
      }))
      .filter(item => item.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(item => item.event);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalEvents = this.events.length;
    const recentEvents = this.events.filter(e => e.timestamp > oneDayAgo).length;
    const weeklyEvents = this.events.filter(e => e.timestamp > oneWeekAgo).length;

    const criticalEvents = this.events.filter(e => e.severity === 'critical').length;
    const highEvents = this.events.filter(e => e.severity === 'high').length;
    const resolvedEvents = this.events.filter(e => e.status === 'resolved').length;
    const newEvents = this.events.filter(e => e.status === 'new').length;

    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = this.events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByStatus = this.events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate daily stats for the last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayEvents = this.events.filter(e => e.timestamp >= dayStart && e.timestamp <= dayEnd);

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        events: dayEvents.length,
        critical: dayEvents.filter(e => e.severity === 'critical').length,
        high: dayEvents.filter(e => e.severity === 'high').length,
        medium: dayEvents.filter(e => e.severity === 'medium').length,
        low: dayEvents.filter(e => e.severity === 'low').length
      });
    }

    return {
      totalEvents,
      recentEvents,
      weeklyEvents,
      criticalEvents,
      highEvents,
      resolvedEvents,
      newEvents,
      eventsByType,
      eventsBySeverity,
      eventsByStatus,
      dailyStats
    };
  }

  startContinuousGeneration(intervalMs = 5000) {
    if (this.isGenerating) return;

    this.isGenerating = true;
    const generateEvent = async () => {
      if (!this.isGenerating) return;

      try {
        const newEvent = dataGenerator.generateRandomEvent();
        await this.addEvent(newEvent);
      } catch (error) {
        console.error('Error generating event:', error);
      }

      setTimeout(generateEvent, intervalMs + Math.random() * intervalMs);
    };

    generateEvent();
  }

  stopContinuousGeneration() {
    this.isGenerating = false;
  }

  getRecentActivity(hours = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  getTopThreats(limit = 5): Array<{type: string, count: number, severity: string}> {
    const threatCounts = this.events.reduce((acc, event) => {
      const key = `${event.event_type}_${event.severity}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(threatCounts)
      .map(([key, count]) => {
        const [type, severity] = key.split('_');
        return { type, count, severity };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const mockDataStore = new MockDataStore();

