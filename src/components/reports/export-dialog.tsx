'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityEvent } from '@/lib/database';
import { reportGenerator, type ReportConfig } from '@/lib/export-utils';
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, Filter, Settings } from 'lucide-react';

interface ExportDialogProps {
  events: SecurityEvent[];
  stats: any;
}

export function ExportDialog({ events, stats }: ExportDialogProps) {
  const [reportType, setReportType] = useState<'incident' | 'compliance' | 'executive' | 'detailed'>('executive');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    severity: 'all',
    eventType: 'all',
    status: 'all'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      // Filter events based on selections
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        if (eventDate < startDate || eventDate > endDate) return false;
        if (filters.severity !== 'all' && event.severity !== filters.severity) return false;
        if (filters.eventType !== 'all' && event.event_type !== filters.eventType) return false;
        if (filters.status !== 'all' && event.status !== filters.status) return false;

        return true;
      });

      const config: ReportConfig = {
        title: getReportTitle(reportType),
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        },
        includeCharts: true,
        includeSummary: true,
        includeRecommendations: true,
        reportType
      };

      switch (exportFormat) {
        case 'pdf':
          await reportGenerator.generatePDFReport(filteredEvents, stats, config);
          break;
        case 'csv':
          reportGenerator.generateCSVReport(filteredEvents, `${reportType}_events_${Date.now()}.csv`);
          break;
        case 'json':
          reportGenerator.generateJSONReport(filteredEvents, stats, `${reportType}_report_${Date.now()}.json`);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAPIReport = async () => {
    setIsGenerating(true);

    try {
      const params = new URLSearchParams({
        type: reportType,
        format: exportFormat,
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(filters.severity !== 'all' && { severity: filters.severity }),
        ...(filters.eventType !== 'all' && { eventType: filters.eventType }),
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();

      // Download the report data as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('API report failed:', error);
      alert('Report generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTitle = (type: string): string => {
    switch (type) {
      case 'incident': return 'Security Incident Report';
      case 'compliance': return 'Compliance Status Report';
      case 'executive': return 'Executive Security Summary';
      case 'detailed': return 'Comprehensive Security Analysis';
      default: return 'Security Report';
    }
  };

  const getFilteredEventCount = (): number => {
    return events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      if (eventDate < startDate || eventDate > endDate) return false;
      if (filters.severity !== 'all' && event.severity !== filters.severity) return false;
      if (filters.eventType !== 'all' && event.event_type !== filters.eventType) return false;
      if (filters.status !== 'all' && event.status !== filters.status) return false;

      return true;
    }).length;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Reports</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generate Security Reports</SheetTitle>
          <SheetDescription>
            Export comprehensive security reports and compliance documentation
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Report Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Report Type</span>
              </CardTitle>
              <CardDescription>Choose the type of report to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="incident">Incident Analysis</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>PDF Report</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>CSV Data</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center space-x-2">
                          <FileJson className="h-4 w-4" />
                          <span>JSON Data</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Date Range</span>
              </CardTitle>
              <CardDescription>Select the time period for the report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
              <CardDescription>Apply filters to customize the report content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="severityFilter">Severity</Label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="typeFilter">Event Type</Label>
                  <Select value={filters.eventType} onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="intrusion">Intrusion</SelectItem>
                      <SelectItem value="malware">Malware</SelectItem>
                      <SelectItem value="network_anomaly">Network Anomaly</SelectItem>
                      <SelectItem value="data_breach">Data Breach</SelectItem>
                      <SelectItem value="phishing">Phishing</SelectItem>
                      <SelectItem value="dos_attack">DoS Attack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusFilter">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="false_positive">False Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border">
                <p className="text-sm text-blue-800">
                  <strong>Filtered Events:</strong> {getFilteredEventCount()} events match your criteria
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Report Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Report Type:</strong> {getReportTitle(reportType)}</p>
                <p><strong>Format:</strong> {exportFormat.toUpperCase()}</p>
                <p><strong>Period:</strong> {dateRange.start} to {dateRange.end}</p>
                <p><strong>Events Included:</strong> {getFilteredEventCount()}</p>
                <p><strong>Estimated Size:</strong> {exportFormat === 'pdf' ? '2-5 MB' : exportFormat === 'csv' ? '500 KB - 2 MB' : '1-3 MB'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Generate Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleExport}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate {exportFormat.toUpperCase()} Report
                </>
              )}
            </Button>

            <Button
              onClick={handleAPIReport}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileJson className="h-4 w-4 mr-2" />
                  API Report
                </>
              )}
            </Button>
          </div>

          {/* Report Types Description */}
          <Card>
            <CardHeader>
              <CardTitle>Report Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div>
                  <strong>Executive Summary:</strong> High-level overview with key metrics and business impact analysis
                </div>
                <div>
                  <strong>Incident Analysis:</strong> Detailed breakdown of security incidents with response actions
                </div>
                <div>
                  <strong>Compliance Report:</strong> Regulatory compliance status with framework mapping
                </div>
                <div>
                  <strong>Detailed Analysis:</strong> Comprehensive technical report with all available data
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

