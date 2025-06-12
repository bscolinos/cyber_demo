import OpenAI from 'openai';
import type { SecurityEvent } from './database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

export interface ThreatAnalysis {
  threat_type: string;
  severity_justification: string;
  recommended_actions: string[];
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  similar_attacks: string[];
  indicators_of_compromise: string[];
}

export class AISecurityAnalyzer {
  async analyzeSecurityEvent(event: Partial<SecurityEvent>): Promise<ThreatAnalysis> {
    try {
      const prompt = this.createAnalysisPrompt(event);

      if (!process.env.OPENAI_API_KEY) {
        // Return mock analysis for demo
        return this.getMockAnalysis(event);
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert cybersecurity analyst. Analyze security events and provide detailed threat assessments. Always respond with valid JSON in the exact format specified.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      if (!response) throw new Error('No response from AI');

      return JSON.parse(response);
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return this.getMockAnalysis(event);
    }
  }

  private createAnalysisPrompt(event: Partial<SecurityEvent>): string {
    return `
Analyze this cybersecurity event and provide a detailed threat assessment:

Event Type: ${event.event_type}
Severity: ${event.severity}
Source IP: ${event.source_ip}
Destination IP: ${event.destination_ip || 'N/A'}
Description: ${event.description}
Raw Data: ${JSON.stringify(event.raw_data, null, 2)}

Please provide your analysis in the following JSON format:
{
  "threat_type": "string - specific type of threat detected",
  "severity_justification": "string - explanation for the severity level",
  "recommended_actions": ["array", "of", "specific", "action", "items"],
  "confidence_score": 0.95,
  "risk_level": "one of: low, medium, high, critical",
  "similar_attacks": ["array", "of", "similar", "known", "attacks"],
  "indicators_of_compromise": ["array", "of", "IOCs", "identified"]
}

Focus on practical, actionable insights and be specific about the threat assessment.
    `;
  }

  private getMockAnalysis(event: Partial<SecurityEvent>): ThreatAnalysis {
    const mockAnalyses = {
      'intrusion': {
        threat_type: 'Unauthorized Access Attempt',
        severity_justification: 'Multiple failed authentication attempts from suspicious IP address indicating potential brute force attack',
        recommended_actions: [
          'Block source IP address immediately',
          'Review and strengthen authentication policies',
          'Monitor for additional attempts from same subnet',
          'Verify integrity of targeted accounts'
        ],
        confidence_score: 0.87,
        risk_level: 'high' as const,
        similar_attacks: ['Credential stuffing', 'Dictionary attack', 'SSH brute force'],
        indicators_of_compromise: ['Rapid authentication failures', 'Non-standard user agent', 'Geographic anomaly']
      },
      'malware': {
        threat_type: 'Malicious File Execution',
        severity_justification: 'Detected execution of known malicious binary with suspicious network communications',
        recommended_actions: [
          'Isolate affected system immediately',
          'Run full system scan with updated definitions',
          'Check for lateral movement indicators',
          'Preserve system image for forensic analysis'
        ],
        confidence_score: 0.94,
        risk_level: 'critical' as const,
        similar_attacks: ['Trojan deployment', 'Ransomware execution', 'Remote access tool'],
        indicators_of_compromise: ['Suspicious process execution', 'Unexpected network traffic', 'File system modifications']
      },
      'network_anomaly': {
        threat_type: 'Abnormal Network Traffic Pattern',
        severity_justification: 'Unusual data exfiltration patterns detected suggesting potential data breach',
        recommended_actions: [
          'Monitor network traffic for sensitive data',
          'Check data access logs for anomalies',
          'Verify user account activities',
          'Review firewall and DLP policies'
        ],
        confidence_score: 0.76,
        risk_level: 'medium' as const,
        similar_attacks: ['Data exfiltration', 'Command and control communication', 'DNS tunneling'],
        indicators_of_compromise: ['Unusual data volumes', 'Off-hours activity', 'Encrypted communications']
      }
    };

    return mockAnalyses[event.event_type as keyof typeof mockAnalyses] || mockAnalyses['intrusion'];
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // Return mock embedding for demo
        return Array.from({length: 1536}, () => Math.random() * 2 - 1);
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return mock embedding
      return Array.from({length: 1536}, () => Math.random() * 2 - 1);
    }
  }

  async classifyThreatSeverity(description: string, eventData: any): Promise<'low' | 'medium' | 'high' | 'critical'> {
    const severityKeywords = {
      critical: ['ransomware', 'data breach', 'root access', 'admin compromise', 'system shutdown'],
      high: ['malware', 'intrusion', 'unauthorized access', 'privilege escalation', 'data exfiltration'],
      medium: ['suspicious activity', 'failed login', 'network scan', 'unusual traffic'],
      low: ['informational', 'policy violation', 'minor anomaly']
    };

    const text = (description + ' ' + JSON.stringify(eventData)).toLowerCase();

    for (const [severity, keywords] of Object.entries(severityKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return severity as 'low' | 'medium' | 'high' | 'critical';
      }
    }

    return 'medium';
  }

  async generateThreatReport(events: SecurityEvent[]): Promise<string> {
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const highEvents = events.filter(e => e.severity === 'high').length;
    const eventTypes = [...new Set(events.map(e => e.event_type))];

    return `
# Security Threat Report

## Executive Summary
- Total Events Analyzed: ${events.length}
- Critical Threats: ${criticalEvents}
- High Priority Threats: ${highEvents}
- Active Threat Types: ${eventTypes.join(', ')}

## Key Findings
${criticalEvents > 0 ? `⚠️ CRITICAL: ${criticalEvents} critical security events require immediate attention` : ''}
${highEvents > 5 ? `🔴 HIGH: Elevated threat activity detected (${highEvents} high-severity events)` : ''}

## Recommendations
1. Prioritize investigation of critical and high-severity events
2. Implement additional monitoring for detected threat types
3. Review and update security policies based on current threat landscape
4. Consider threat hunting activities for similar attack patterns

Generated by AI Security Analyzer
    `.trim();
  }
}

export const aiAnalyzer = new AISecurityAnalyzer();

