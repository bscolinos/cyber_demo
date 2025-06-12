'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SecurityOverview } from '@/components/dashboard/security-overview';
import { EventsTable } from '@/components/dashboard/events-table';
import { ExportDialog } from '@/components/reports/export-dialog';
import type { SecurityEvent } from '@/lib/database';
import { Shield, Activity, Database, Zap, Play, Pause, FileText } from 'lucide-react';

interface DashboardStats {
  totalEvents: number;
  recentEvents: number;
  criticalEvents: number;
  highEvents: number;
  resolvedEvents: number;
  newEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByStatus: Record<string, number>;
  dailyStats: Array<{
    date: string;
    events: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  topThreats: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}

export default function CybersecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?limit=100');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateEvent = async () => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      });
      await Promise.all([fetchEvents(), fetchStats()]);
    } catch (error) {
      console.error('Error generating event:', error);
    }
  };

  const handleEventUpdate = async (id: string, status: SecurityEvent['status']) => {
    try {
      await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await Promise.all([fetchEvents(), fetchStats()]);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const startAutoGeneration = () => {
    setIsGenerating(true);
    const interval = setInterval(async () => {
      await generateEvent();
    }, 3000); // Generate every 3 seconds

    // Store interval ID to clear it later
    (window as any).generationInterval = interval;
  };

  const stopAutoGeneration = () => {
    setIsGenerating(false);
    if ((window as any).generationInterval) {
      clearInterval((window as any).generationInterval);
      (window as any).generationInterval = null;
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchEvents(), fetchStats()]);
    setIsLoading(false);
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEvents(), fetchStats()]);
      setIsLoading(false);
    };

    initializeData();

    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      if (!isGenerating) {
        refreshData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(refreshInterval);
      stopAutoGeneration();
    };
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Initializing Security Platform</h2>
          <p className="text-gray-600">Loading AI-powered cybersecurity monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CyberShield AI</h1>
              <p className="text-sm text-gray-600">AI-Powered Cybersecurity Monitoring Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={isGenerating ? stopAutoGeneration : startAutoGeneration}
                variant={isGenerating ? "destructive" : "default"}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Demo
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Demo
                  </>
                )}
              </Button>

              <Button onClick={generateEvent} variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Generate Event
              </Button>

              <ExportDialog events={events} stats={stats} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Events</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SecurityOverview stats={stats} />
          </TabsContent>

          <TabsContent value="events">
            <EventsTable
              events={events}
              onEventUpdate={handleEventUpdate}
              onRefresh={refreshData}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Analysis</CardTitle>
                  <CardDescription>
                    Advanced threat detection using machine learning and vector similarity search
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border">
                    <h4 className="font-medium text-blue-900 mb-2">Vector Search Capabilities</h4>
                    <p className="text-sm text-blue-800">
                      Our platform uses SingleStoreDB's vector search to identify similar attack patterns
                      and correlate security events across your infrastructure.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border">
                    <h4 className="font-medium text-green-900 mb-2">Real-time AI Analysis</h4>
                    <p className="text-sm text-green-800">
                      Each security event is automatically analyzed by our AI engine to provide
                      threat classification, severity assessment, and recommended actions.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border">
                    <h4 className="font-medium text-purple-900 mb-2">Continuous Learning</h4>
                    <p className="text-sm text-purple-800">
                      The system learns from historical data and analyst feedback to improve
                      detection accuracy and reduce false positives over time.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Features</CardTitle>
                  <CardDescription>
                    Key capabilities of the cybersecurity monitoring platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">SingleStoreDB Integration</h4>
                      <p className="text-sm text-gray-600">
                        High-performance database with built-in vector search and JSON support
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">AI Threat Analysis</h4>
                      <p className="text-sm text-gray-600">
                        Advanced LLM-powered analysis for threat identification and response
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Real-time Monitoring</h4>
                      <p className="text-sm text-gray-600">
                        Continuous monitoring with live event processing and alerting
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Automated Response</h4>
                      <p className="text-sm text-gray-600">
                        AI-driven recommendations for incident response and mitigation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Generation</CardTitle>
                  <CardDescription>
                    Generate comprehensive security reports for compliance and executive review
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <ExportDialog events={events} stats={stats} />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg border">
                      <h4 className="font-medium text-blue-900 mb-1">Executive Reports</h4>
                      <p className="text-blue-800">High-level summaries for leadership and stakeholders</p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border">
                      <h4 className="font-medium text-green-900 mb-1">Compliance Documentation</h4>
                      <p className="text-green-800">SOC 2, NIST, ISO 27001, and GDPR compliance reports</p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border">
                      <h4 className="font-medium text-purple-900 mb-1">Incident Analysis</h4>
                      <p className="text-purple-800">Detailed technical analysis of security events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Formats</CardTitle>
                  <CardDescription>
                    Multiple formats available for different use cases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">PDF Reports</h4>
                        <p className="text-sm text-gray-600">
                          Professional reports with charts, analysis, and recommendations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Database className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">CSV Data Export</h4>
                        <p className="text-sm text-gray-600">
                          Raw event data for further analysis in spreadsheet applications
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">JSON API Data</h4>
                        <p className="text-sm text-gray-600">
                          Structured data for integration with other security tools
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Recent Statistics</h4>
                    <div className="text-sm space-y-1">
                      <p>Total Events Available: <strong>{stats?.totalEvents || 0}</strong></p>
                      <p>Critical Events: <strong>{stats?.criticalEvents || 0}</strong></p>
                      <p>Reports Generated Today: <strong>12</strong></p>
                      <p>Compliance Score: <strong>94%</strong></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}