import mysql from 'mysql2/promise';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  event_type: 'intrusion' | 'malware' | 'network_anomaly' | 'data_breach' | 'phishing' | 'dos_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  destination_ip?: string;
  description: string;
  raw_data: any;
  ai_analysis?: string;
  confidence_score?: number;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  tags: string[];
  embedding?: number[];
}

export interface ThreatIntelligence {
  id: string;
  threat_type: string;
  indicators: string[];
  description: string;
  confidence: number;
  source: string;
  created_at: Date;
  embedding: number[];
}

class DatabaseManager {
  private connection: mysql.Connection | null = null;

  async connect() {
    if (this.connection) return this.connection;

    // For demo purposes, we'll create a mock connection
    // In production, you would use actual SingleStore credentials
    try {
      this.connection = await mysql.createConnection({
        host: process.env.SINGLESTORE_HOST || 'localhost',
        port: Number.parseInt(process.env.SINGLESTORE_PORT || '3306'),
        user: process.env.SINGLESTORE_USER || 'root',
        password: process.env.SINGLESTORE_PASSWORD || '',
        database: process.env.SINGLESTORE_DATABASE || 'cybersecurity_platform'
      });
      console.log('Connected to SingleStoreDB');
      return this.connection;
    } catch (error) {
      console.log('Using mock database for demo purposes');
      // For demo, we'll simulate database operations
      return null;
    }
  }

  async initializeSchema() {
    const conn = await this.connect();
    if (!conn) return; // Skip for demo

    try {
      // Create security_events table with vector support
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS security_events (
          id VARCHAR(36) PRIMARY KEY,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          event_type ENUM('intrusion', 'malware', 'network_anomaly', 'data_breach', 'phishing', 'dos_attack'),
          severity ENUM('low', 'medium', 'high', 'critical'),
          source_ip VARCHAR(45),
          destination_ip VARCHAR(45),
          description TEXT,
          raw_data JSON,
          ai_analysis TEXT,
          confidence_score FLOAT,
          status ENUM('new', 'investigating', 'resolved', 'false_positive') DEFAULT 'new',
          tags JSON,
          embedding BLOB,
          INDEX(timestamp),
          INDEX(event_type),
          INDEX(severity),
          INDEX(status)
        )
      `);

      // Create threat_intelligence table
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS threat_intelligence (
          id VARCHAR(36) PRIMARY KEY,
          threat_type VARCHAR(100),
          indicators JSON,
          description TEXT,
          confidence FLOAT,
          source VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          embedding BLOB
        )
      `);

      console.log('Database schema initialized');
    } catch (error) {
      console.error('Error initializing schema:', error);
    }
  }

  async insertSecurityEvent(event: Omit<SecurityEvent, 'id'>) {
    const conn = await this.connect();
    if (!conn) {
      // For demo, return mock ID
      return crypto.randomUUID();
    }

    try {
      const id = crypto.randomUUID();
      await conn.execute(`
        INSERT INTO security_events
        (id, timestamp, event_type, severity, source_ip, destination_ip, description, raw_data, ai_analysis, confidence_score, status, tags, embedding)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        event.timestamp,
        event.event_type,
        event.severity,
        event.source_ip,
        event.destination_ip,
        event.description,
        JSON.stringify(event.raw_data),
        event.ai_analysis,
        event.confidence_score,
        event.status,
        JSON.stringify(event.tags),
        event.embedding ? Buffer.from(new Float32Array(event.embedding).buffer) : null
      ]);
      return id;
    } catch (error) {
      console.error('Error inserting security event:', error);
      throw error;
    }
  }

  async getSecurityEvents(limit = 100, offset = 0) {
    const conn = await this.connect();
    if (!conn) {
      // Return mock data for demo
      return [];
    }

    try {
      const [rows] = await conn.execute(`
        SELECT * FROM security_events
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error fetching security events:', error);
      return [];
    }
  }

  async searchSimilarEvents(embedding: number[], threshold = 0.8, limit = 10) {
    const conn = await this.connect();
    if (!conn) {
      return [];
    }

    try {
      // Using SingleStore's vector similarity search
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
      const [rows] = await conn.execute(`
        SELECT *, DOT_PRODUCT(embedding, ?) as similarity
        FROM security_events
        WHERE embedding IS NOT NULL
        HAVING similarity > ?
        ORDER BY similarity DESC
        LIMIT ?
      `, [embeddingBuffer, threshold, limit]);
      return rows;
    } catch (error) {
      console.error('Error searching similar events:', error);
      return [];
    }
  }

  async updateEventStatus(id: string, status: SecurityEvent['status'], aiAnalysis?: string) {
    const conn = await this.connect();
    if (!conn) return;

    try {
      await conn.execute(`
        UPDATE security_events
        SET status = ?, ai_analysis = COALESCE(?, ai_analysis)
        WHERE id = ?
      `, [status, aiAnalysis, id]);
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  }

  async getEventStats() {
    const conn = await this.connect();
    if (!conn) {
      // Return mock stats for demo
      return {
        totalEvents: 0,
        criticalEvents: 0,
        resolvedEvents: 0,
        eventsByType: {},
        eventsBySeverity: {}
      };
    }

    try {
      const [stats] = await conn.execute(`
        SELECT
          COUNT(*) as total_events,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_events,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_events
        FROM security_events
      `);

      const [typeStats] = await conn.execute(`
        SELECT event_type, COUNT(*) as count
        FROM security_events
        GROUP BY event_type
      `);

      const [severityStats] = await conn.execute(`
        SELECT severity, COUNT(*) as count
        FROM security_events
        GROUP BY severity
      `);

      return {
        totalEvents: (stats as any)[0].total_events,
        criticalEvents: (stats as any)[0].critical_events,
        resolvedEvents: (stats as any)[0].resolved_events,
        eventsByType: Object.fromEntries(
          (typeStats as any[]).map(row => [row.event_type, row.count])
        ),
        eventsBySeverity: Object.fromEntries(
          (severityStats as any[]).map(row => [row.severity, row.count])
        )
      };
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        resolvedEvents: 0,
        eventsByType: {},
        eventsBySeverity: {}
      };
    }
  }
}

export const db = new DatabaseManager();

