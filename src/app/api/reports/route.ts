import { type NextRequest, NextResponse } from 'next/server';
import { mockDataStore } from '@/lib/mock-data-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'summary';
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const severity = searchParams.get('severity');
    const eventType = searchParams.get('eventType');

    // Get events with filters
    let events = mockDataStore.getEvents(1000, 0);

    // Apply date filters
    if (startDate) {
      const start = new Date(startDate);
      events = events.filter(event => new Date(event.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      events = events.filter(event => new Date(event.timestamp) <= end);
    }

    // Apply other filters
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    if (eventType) {
      events = events.filter(event => event.event_type === eventType);
    }

    const stats = mockDataStore.getStats();

    // Generate different report types
    let reportData;
    switch (reportType) {
      case 'compliance':
        reportData = generateComplianceReport(events, stats);
        break;
      case 'executive':
        reportData = generateExecutiveReport(events, stats);
        break;
      case 'incident':
        reportData = generateIncidentReport(events, stats);
        break;
      case 'detailed':
        reportData = generateDetailedReport(events, stats);
        break;
      default:
        reportData = generateSummaryReport(events, stats);
    }

    return NextResponse.json({
      report: reportData,
      metadata: {
        generated_at: new Date().toISOString(),
        report_type: reportType,
        format: format,
        filters: {
          startDate,
          endDate,
          severity,
          eventType
        },
        total_events: events.length
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateComplianceReport(events: any[], stats: any) {
  const frameworks = [
    {
      name: 'SOC 2 Type II',
      status: stats.criticalEvents === 0 ? 'Compliant' : 'Non-Compliant',
      score: Math.max(0, 100 - (stats.criticalEvents * 10 + stats.highEvents * 5)),
      requirements: [
        {
          control: 'Security Monitoring',
          status: 'Implemented',
          evidence: 'AI-powered continuous monitoring in place'
        },
        {
          control: 'Incident Response',
          status: stats.resolvedEvents / stats.totalEvents > 0.8 ? 'Compliant' : 'Needs Improvement',
          evidence: `${((stats.resolvedEvents / stats.totalEvents) * 100).toFixed(1)}% resolution rate`
        },
        {
          control: 'Threat Detection',
          status: 'Implemented',
          evidence: 'Vector-based similarity detection active'
        }
      ],
      issues: stats.criticalEvents + stats.highEvents,
      recommendations: generateComplianceRecommendations(stats)
    },
    {
      name: 'NIST Cybersecurity Framework',
      status: 'Implemented',
      score: 85,
      requirements: [
        {
          control: 'Identify (ID)',
          status: 'Compliant',
          evidence: 'Asset inventory and threat identification in place'
        },
        {
          control: 'Protect (PR)',
          status: 'Compliant',
          evidence: 'Access controls and protective measures implemented'
        },
        {
          control: 'Detect (DE)',
          status: 'Compliant',
          evidence: 'Continuous monitoring and detection capabilities'
        },
        {
          control: 'Respond (RS)',
          status: stats.resolvedEvents / stats.totalEvents > 0.7 ? 'Compliant' : 'Needs Improvement',
          evidence: `Response time and resolution tracking active`
        },
        {
          control: 'Recover (RC)',
          status: 'Compliant',
          evidence: 'Recovery procedures documented and tested'
        }
      ]
    },
    {
      name: 'ISO 27001:2022',
      status: 'Compliant',
      score: 92,
      requirements: [
        {
          control: 'Information Security Policy',
          status: 'Implemented',
          evidence: 'Security policies documented and enforced'
        },
        {
          control: 'Risk Management',
          status: 'Implemented',
          evidence: 'AI-powered risk assessment and threat analysis'
        },
        {
          control: 'Incident Management',
          status: 'Implemented',
          evidence: 'Automated incident detection and response workflows'
        }
      ]
    }
  ];

  return {
    title: 'Compliance Status Report',
    summary: {
      overall_compliance_score: Math.round(frameworks.reduce((acc, f) => acc + f.score, 0) / frameworks.length),
      compliant_frameworks: frameworks.filter(f => f.status === 'Compliant' || f.status === 'Implemented').length,
      total_frameworks: frameworks.length,
      critical_issues: stats.criticalEvents,
      open_findings: stats.newEvents
    },
    frameworks,
    risk_assessment: {
      overall_risk: stats.criticalEvents > 0 ? 'High' : stats.highEvents > 10 ? 'Medium' : 'Low',
      threat_landscape: analyzeTheatLandscape(events),
      mitigation_status: `${((stats.resolvedEvents / stats.totalEvents) * 100).toFixed(1)}% of incidents resolved`
    },
    audit_trail: events.slice(0, 20).map(event => ({
      timestamp: event.timestamp,
      event_type: event.event_type,
      severity: event.severity,
      status: event.status,
      compliance_impact: event.severity === 'critical' ? 'High' : event.severity === 'high' ? 'Medium' : 'Low'
    }))
  };
}

function generateExecutiveReport(events: any[], stats: any) {
  return {
    title: 'Executive Security Summary',
    period: {
      start: events.length > 0 ? events[events.length - 1].timestamp : new Date(),
      end: events.length > 0 ? events[0].timestamp : new Date(),
      total_days: 30
    },
    key_metrics: {
      total_security_events: stats.totalEvents,
      critical_incidents: stats.criticalEvents,
      high_priority_events: stats.highEvents,
      resolution_rate: `${((stats.resolvedEvents / stats.totalEvents) * 100).toFixed(1)}%`,
      mean_time_to_resolution: '4.2 hours',
      security_posture: stats.criticalEvents === 0 ? 'Strong' : stats.criticalEvents < 5 ? 'Good' : 'Needs Attention'
    },
    threat_summary: {
      top_threats: getTopThreats(events),
      attack_vectors: getAttackVectors(events),
      geographic_sources: ['Russia (23%)', 'China (18%)', 'North Korea (12%)', 'Other (47%)'],
      trending_threats: ['Ransomware attacks +15%', 'Phishing attempts +8%', 'DDoS attacks -5%']
    },
    business_impact: {
      estimated_cost_avoidance: '$2.3M',
      prevented_data_breaches: events.filter(e => e.event_type === 'data_breach' && e.status === 'resolved').length,
      system_availability: '99.8%',
      compliance_status: 'Maintained'
    },
    strategic_recommendations: [
      'Increase investment in AI-driven threat detection capabilities',
      'Expand security team capacity to handle growing threat volume',
      'Implement advanced threat hunting procedures',
      'Enhance employee security awareness training',
      'Consider additional endpoint protection solutions'
    ],
    budget_implications: {
      current_security_spend: '$1.2M annually',
      recommended_additional_investment: '$300K',
      roi_projection: '400% over 2 years',
      priority_investments: ['Advanced threat detection', 'Security team expansion', 'Training programs']
    }
  };
}

function generateIncidentReport(events: any[], stats: any) {
  const criticalIncidents = events.filter(e => e.severity === 'critical');
  const highIncidents = events.filter(e => e.severity === 'high');

  return {
    title: 'Security Incident Analysis Report',
    summary: {
      total_incidents: events.length,
      critical_incidents: criticalIncidents.length,
      high_priority_incidents: highIncidents.length,
      resolved_incidents: stats.resolvedEvents,
      pending_incidents: stats.newEvents,
      false_positives: events.filter(e => e.status === 'false_positive').length
    },
    incident_breakdown: {
      by_type: stats.eventsByType,
      by_severity: stats.eventsBySeverity,
      by_status: stats.eventsByStatus,
      resolution_times: {
        critical: '2.1 hours average',
        high: '6.5 hours average',
        medium: '24 hours average',
        low: '72 hours average'
      }
    },
    detailed_incidents: criticalIncidents.concat(highIncidents).slice(0, 10).map(incident => ({
      id: incident.id,
      timestamp: incident.timestamp,
      type: incident.event_type,
      severity: incident.severity,
      source_ip: incident.source_ip,
      description: incident.description,
      status: incident.status,
      ai_analysis: incident.ai_analysis ? JSON.parse(incident.ai_analysis) : null,
      response_actions: getResponseActions(incident)
    })),
    trends: {
      daily_incidents: stats.dailyStats,
      peak_hours: ['14:00-16:00 (18% of incidents)', '10:00-12:00 (15% of incidents)'],
      common_sources: getCommonSources(events),
      attack_patterns: analyzeAttackPatterns(events)
    },
    lessons_learned: [
      'Early detection significantly reduces incident impact',
      'AI analysis improves response time by 40%',
      'Most critical incidents originate from known threat actors',
      'Phishing remains the primary attack vector'
    ]
  };
}

function generateDetailedReport(events: any[], stats: any) {
  return {
    title: 'Comprehensive Security Analysis Report',
    executive_summary: generateExecutiveReport(events, stats),
    technical_analysis: {
      event_correlation: analyzeEventCorrelation(events),
      threat_intelligence: generateThreatIntelligence(events),
      attack_chain_analysis: analyzeAttackChains(events),
      indicators_of_compromise: extractIOCs(events)
    },
    compliance_status: generateComplianceReport(events, stats),
    incident_details: generateIncidentReport(events, stats),
    recommendations: {
      immediate_actions: getImmediateActions(stats),
      short_term_improvements: getShortTermRecommendations(events, stats),
      long_term_strategy: getLongTermStrategy(events, stats)
    },
    appendix: {
      raw_events: events.slice(0, 50),
      technical_details: {
        detection_methods: ['Signature-based', 'Behavioral analysis', 'Machine learning', 'Threat intelligence'],
        data_sources: ['Network logs', 'Endpoint telemetry', 'Cloud audit trails', 'User activity'],
        analysis_tools: ['AI/ML algorithms', 'Vector similarity search', 'Pattern recognition']
      }
    }
  };
}

function generateSummaryReport(events: any[], stats: any) {
  return {
    title: 'Security Summary Report',
    overview: {
      total_events: stats.totalEvents,
      critical_events: stats.criticalEvents,
      high_events: stats.highEvents,
      resolved_events: stats.resolvedEvents,
      resolution_rate: `${((stats.resolvedEvents / stats.totalEvents) * 100).toFixed(1)}%`
    },
    top_threats: getTopThreats(events),
    recent_activity: events.slice(0, 20),
    key_metrics: {
      threat_level: stats.criticalEvents > 0 ? 'High' : stats.highEvents > 10 ? 'Medium' : 'Low',
      system_health: 'Operational',
      compliance_status: 'Compliant'
    }
  };
}

// Helper functions
function getTopThreats(events: any[]) {
  const threatCounts = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(threatCounts)
    .map(([type, count]) => ({ type: type.replace('_', ' '), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getAttackVectors(events: any[]) {
  const vectors = ['Email phishing', 'Network intrusion', 'Malware execution', 'Social engineering', 'Supply chain'];
  return vectors.map(vector => ({
    vector,
    frequency: Math.floor(Math.random() * 50) + 10,
    trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
  }));
}

function analyzeTheatLandscape(events: any[]) {
  return {
    primary_threats: ['Advanced Persistent Threats', 'Ransomware', 'Data Exfiltration'],
    emerging_threats: ['AI-powered attacks', 'Supply chain compromises', 'Cloud misconfigurations'],
    threat_actors: ['Nation-state actors', 'Cybercriminal groups', 'Insider threats']
  };
}

function getResponseActions(incident: any) {
  return [
    'Incident detected and classified',
    'Security team notified',
    'Initial containment measures applied',
    'Forensic analysis initiated',
    'Stakeholders informed'
  ];
}

function getCommonSources(events: any[]) {
  const sources = events.reduce((acc, event) => {
    acc[event.source_ip] = (acc[event.source_ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sources)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
}

function analyzeAttackPatterns(events: any[]) {
  return [
    'Multi-stage attacks increasing by 25%',
    'Lateral movement techniques evolving',
    'Zero-day exploits detected in 12% of incidents',
    'Living-off-the-land tactics commonly observed'
  ];
}

function analyzeEventCorrelation(events: any[]) {
  return {
    correlated_events: Math.floor(events.length * 0.15),
    attack_chains: Math.floor(events.length * 0.08),
    false_positive_rate: '5.2%'
  };
}

function generateThreatIntelligence(events: any[]) {
  return {
    known_threat_actors: ['APT29', 'Lazarus Group', 'FIN7'],
    malware_families: ['Emotet', 'TrickBot', 'Ryuk'],
    campaign_tracking: ['Operation XYZ', 'Campaign ABC'],
    ioc_feeds: ['External threat feeds', 'Internal IOCs', 'Partner sharing']
  };
}

function analyzeAttackChains(events: any[]) {
  return [
    {
      stage: 'Initial Access',
      techniques: ['Phishing', 'Exploit public-facing application'],
      frequency: '45%'
    },
    {
      stage: 'Execution',
      techniques: ['Command and scripting interpreter', 'User execution'],
      frequency: '38%'
    },
    {
      stage: 'Persistence',
      techniques: ['Registry run keys', 'Scheduled tasks'],
      frequency: '32%'
    }
  ];
}

function extractIOCs(events: any[]) {
  return {
    ip_addresses: ['192.168.1.100', '10.0.0.50', '172.16.0.25'],
    domains: ['malicious-domain.com', 'phishing-site.net'],
    file_hashes: ['a1b2c3d4e5f6...', 'f6e5d4c3b2a1...'],
    urls: ['http://malicious-url.com/payload', 'https://phishing-login.net']
  };
}

function getImmediateActions(stats: any) {
  const actions = [];
  if (stats.criticalEvents > 0) {
    actions.push('Address all critical security events within 24 hours');
  }
  if (stats.newEvents > 20) {
    actions.push('Triage pending incidents and assign appropriate resources');
  }
  actions.push('Verify all security controls are functioning properly');
  return actions;
}

function getShortTermRecommendations(events: any[], stats: any) {
  return [
    'Implement automated incident response workflows',
    'Enhance threat intelligence integration',
    'Improve security awareness training',
    'Optimize detection rules to reduce false positives'
  ];
}

function getLongTermStrategy(events: any[], stats: any) {
  return [
    'Develop advanced threat hunting capabilities',
    'Implement zero-trust architecture',
    'Enhance AI/ML driven security analytics',
    'Build strategic security partnerships'
  ];
}

function generateComplianceRecommendations(stats: any) {
  const recommendations = [];
  if (stats.criticalEvents > 0) {
    recommendations.push('Implement immediate containment procedures for critical events');
  }
  if (stats.resolvedEvents / stats.totalEvents < 0.8) {
    recommendations.push('Improve incident response times to meet compliance requirements');
  }
  recommendations.push('Regular compliance audits and documentation updates');
  return recommendations;
}

