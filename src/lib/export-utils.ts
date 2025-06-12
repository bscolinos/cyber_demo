import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import type { SecurityEvent } from './database';

export interface ReportConfig {
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includeSummary: boolean;
  includeRecommendations: boolean;
  reportType: 'incident' | 'compliance' | 'executive' | 'detailed';
}

export class SecurityReportGenerator {

  generateCSVReport(events: SecurityEvent[], filename = 'security_events.csv'): void {
    const csvData = events.map(event => ({
      ID: event.id,
      Timestamp: new Date(event.timestamp).toISOString(),
      'Event Type': event.event_type,
      Severity: event.severity,
      'Source IP': event.source_ip,
      'Destination IP': event.destination_ip || 'N/A',
      Description: event.description,
      Status: event.status,
      'Confidence Score': event.confidence_score || 'N/A',
      Tags: event.tags.join(', '),
      'AI Analysis': event.ai_analysis ? 'Available' : 'Not Available'
    }));

    const csv = Papa.unparse(csvData);
    this.downloadFile(csv, filename, 'text/csv');
  }

  generateJSONReport(events: SecurityEvent[], stats: any, filename = 'security_report.json'): void {
    const report = {
      generated_at: new Date().toISOString(),
      report_period: {
        start: events.length > 0 ? events[events.length - 1].timestamp : new Date(),
        end: events.length > 0 ? events[0].timestamp : new Date()
      },
      summary: stats,
      events: events,
      metadata: {
        total_events: events.length,
        critical_events: events.filter(e => e.severity === 'critical').length,
        high_events: events.filter(e => e.severity === 'high').length,
        resolved_events: events.filter(e => e.status === 'resolved').length
      }
    };

    const json = JSON.stringify(report, null, 2);
    this.downloadFile(json, filename, 'application/json');
  }

  async generatePDFReport(events: SecurityEvent[], stats: any, config: ReportConfig): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CyberShield AI Security Report', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.text(`Report Period: ${config.dateRange.start.toLocaleDateString()} - ${config.dateRange.end.toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 20;

    // Executive Summary
    if (config.includeSummary) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const summaryData = [
        ['Metric', 'Value', 'Status'],
        ['Total Events', stats.totalEvents.toString(), this.getStatusColor(stats.totalEvents, 'events')],
        ['Critical Events', stats.criticalEvents.toString(), this.getStatusColor(stats.criticalEvents, 'critical')],
        ['High Priority Events', stats.highEvents.toString(), this.getStatusColor(stats.highEvents, 'high')],
        ['Resolution Rate', `${((stats.resolvedEvents / stats.totalEvents) * 100).toFixed(1)}%`, this.getStatusColor(stats.resolvedEvents / stats.totalEvents, 'rate')],
        ['Pending Events', stats.newEvents.toString(), this.getStatusColor(stats.newEvents, 'pending')]
      ];

      autoTable(doc, {
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Threat Analysis
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Threat Analysis', 14, yPosition);
    yPosition += 10;

    // Top threats table
    const topThreats = this.getTopThreats(events);
    const threatTableData = [
      ['Threat Type', 'Count', 'Severity', 'Last Seen'],
      ...topThreats.map(threat => [
        threat.type.replace('_', ' '),
        threat.count.toString(),
        threat.severity,
        threat.lastSeen
      ])
    ];

    autoTable(doc, {
      head: [threatTableData[0]],
      body: threatTableData.slice(1),
      startY: yPosition,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Recent Critical Events
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Critical Events', 14, yPosition);
    yPosition += 10;

    const criticalEvents = events.filter(e => e.severity === 'critical').slice(0, 10);
    if (criticalEvents.length > 0) {
      const criticalTableData = [
        ['Time', 'Type', 'Source IP', 'Description'],
        ...criticalEvents.map(event => [
          new Date(event.timestamp).toLocaleString(),
          event.event_type.replace('_', ' '),
          event.source_ip,
          this.truncateText(event.description, 50)
        ])
      ];

      autoTable(doc, {
        head: [criticalTableData[0]],
        body: criticalTableData.slice(1),
        startY: yPosition,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [192, 57, 43] },
        columnStyles: {
          3: { cellWidth: 80 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.text('No critical events in the selected period.', 14, yPosition);
      yPosition += 15;
    }

    // Recommendations
    if (config.includeRecommendations) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Security Recommendations', 14, yPosition);
      yPosition += 10;

      const recommendations = this.generateRecommendations(stats, events);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      recommendations.forEach((rec, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(`${index + 1}. ${rec}`, 14, yPosition);
        yPosition += 7;
      });
    }

    // Compliance Section
    if (config.reportType === 'compliance') {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Compliance Status', 14, yPosition);
      yPosition += 10;

      const complianceData = this.generateComplianceReport(events, stats);
      autoTable(doc, {
        head: [['Compliance Framework', 'Status', 'Score', 'Issues']],
        body: complianceData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [46, 125, 50] }
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('CyberShield AI - Confidential', 14, pageHeight - 10);
    }

    // Save the PDF
    doc.save(`cybersecurity_report_${new Date().getTime()}.pdf`);
  }

  generateComplianceReport(events: SecurityEvent[], stats: any): string[][] {
    const frameworks = [
      {
        name: 'SOC 2',
        status: stats.criticalEvents === 0 ? 'Compliant' : 'Non-Compliant',
        score: Math.max(0, 100 - (stats.criticalEvents * 10 + stats.highEvents * 5)),
        issues: stats.criticalEvents + stats.highEvents
      },
      {
        name: 'NIST Cybersecurity Framework',
        status: stats.resolvedEvents / stats.totalEvents > 0.8 ? 'Good' : 'Needs Improvement',
        score: Math.round((stats.resolvedEvents / stats.totalEvents) * 100),
        issues: stats.newEvents
      },
      {
        name: 'ISO 27001',
        status: stats.totalEvents < 100 ? 'Compliant' : 'Review Required',
        score: Math.max(0, 100 - Math.floor(stats.totalEvents / 10)),
        issues: Math.floor(stats.totalEvents / 50)
      },
      {
        name: 'GDPR',
        status: events.filter(e => e.event_type === 'data_breach').length === 0 ? 'Compliant' : 'Breach Detected',
        score: events.filter(e => e.event_type === 'data_breach').length === 0 ? 100 : 0,
        issues: events.filter(e => e.event_type === 'data_breach').length
      }
    ];

    return frameworks.map(f => [f.name, f.status, `${f.score}%`, f.issues.toString()]);
  }

  generateIncidentReport(event: SecurityEvent): Promise<void> {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Security Incident Report', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Incident ID: ${event.id}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      // Incident Details
      const incidentData = [
        ['Field', 'Value'],
        ['Incident Type', event.event_type.replace('_', ' ')],
        ['Severity Level', event.severity.toUpperCase()],
        ['Detection Time', new Date(event.timestamp).toLocaleString()],
        ['Source IP Address', event.source_ip],
        ['Destination IP', event.destination_ip || 'N/A'],
        ['Current Status', event.status.replace('_', ' ')],
        ['Confidence Score', event.confidence_score ? `${(event.confidence_score * 100).toFixed(1)}%` : 'N/A']
      ];

      autoTable(doc, {
        head: [incidentData[0]],
        body: incidentData.slice(1),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Description
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Incident Description', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitDescription = doc.splitTextToSize(event.description, pageWidth - 28);
      doc.text(splitDescription, 14, yPosition);
      yPosition += splitDescription.length * 5 + 10;

      // AI Analysis
      if (event.ai_analysis) {
        const analysis = JSON.parse(event.ai_analysis);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Analysis', 14, yPosition);
        yPosition += 10;

        const analysisData = [
          ['Analysis Component', 'Details'],
          ['Threat Type', analysis.threat_type],
          ['Risk Level', analysis.risk_level],
          ['Confidence Score', `${(analysis.confidence_score * 100).toFixed(1)}%`]
        ];

        autoTable(doc, {
          head: [analysisData[0]],
          body: analysisData.slice(1),
          startY: yPosition,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [155, 89, 182] }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // Recommendations
        if (analysis.recommended_actions && analysis.recommended_actions.length > 0) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Recommended Actions', 14, yPosition);
          yPosition += 10;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          analysis.recommended_actions.forEach((action: string, index: number) => {
            const actionText = `${index + 1}. ${action}`;
            const splitAction = doc.splitTextToSize(actionText, pageWidth - 28);
            doc.text(splitAction, 14, yPosition);
            yPosition += splitAction.length * 5 + 3;
          });
        }
      }

      // Raw Data (if space allows)
      if (yPosition < doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Technical Details', 14, yPosition);
        yPosition += 10;

        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        const rawDataText = JSON.stringify(event.raw_data, null, 2);
        const splitRawData = doc.splitTextToSize(rawDataText, pageWidth - 28);
        doc.text(splitRawData, 14, yPosition);
      }

      doc.save(`incident_report_${event.id}.pdf`);
      resolve();
    });
  }

  private getTopThreats(events: SecurityEvent[]): Array<{type: string, count: number, severity: string, lastSeen: string}> {
    const threatCounts = events.reduce((acc, event) => {
      const key = event.event_type;
      if (!acc[key]) {
        acc[key] = { count: 0, severity: event.severity, lastSeen: event.timestamp };
      }
      acc[key].count++;
      if (new Date(event.timestamp) > new Date(acc[key].lastSeen)) {
        acc[key].lastSeen = event.timestamp;
      }
      return acc;
    }, {} as Record<string, {count: number, severity: string, lastSeen: Date}>);

    return Object.entries(threatCounts)
      .map(([type, data]) => ({
        type,
        count: data.count,
        severity: data.severity,
        lastSeen: new Date(data.lastSeen).toLocaleDateString()
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getStatusColor(value: number, type: string): string {
    switch (type) {
      case 'critical':
        return value === 0 ? 'Good' : value < 5 ? 'Warning' : 'Critical';
      case 'high':
        return value < 10 ? 'Good' : value < 20 ? 'Warning' : 'Critical';
      case 'rate':
        return value > 0.8 ? 'Good' : value > 0.5 ? 'Warning' : 'Poor';
      case 'pending':
        return value < 10 ? 'Good' : value < 25 ? 'Warning' : 'High';
      default:
        return 'Normal';
    }
  }

  private generateRecommendations(stats: any, events: SecurityEvent[]): string[] {
    const recommendations = [];

    if (stats.criticalEvents > 0) {
      recommendations.push('Immediate action required: Address all critical security events within 24 hours');
    }

    if (stats.resolvedEvents / stats.totalEvents < 0.7) {
      recommendations.push('Improve incident response time - current resolution rate is below industry standard');
    }

    if (stats.newEvents > 20) {
      recommendations.push('High volume of pending events detected - consider increasing security team capacity');
    }

    const malwareEvents = events.filter(e => e.event_type === 'malware').length;
    if (malwareEvents > 5) {
      recommendations.push('Implement additional endpoint protection - multiple malware detections observed');
    }

    const intrusionEvents = events.filter(e => e.event_type === 'intrusion').length;
    if (intrusionEvents > 10) {
      recommendations.push('Review and strengthen network access controls - frequent intrusion attempts detected');
    }

    if (recommendations.length === 0) {
      recommendations.push('Current security posture appears stable - continue monitoring and regular reviews');
    }

    return recommendations;
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const reportGenerator = new SecurityReportGenerator();

