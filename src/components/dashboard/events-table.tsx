'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SecurityEvent } from '@/lib/database';
import { Eye, Bot, Network, AlertCircle, RefreshCw } from 'lucide-react';
import { IncidentReportButton } from '@/components/reports/incident-report-button';
import { formatDistanceToNow } from 'date-fns';

interface EventsTableProps {
  events: SecurityEvent[];
  onEventUpdate: (id: string, status: SecurityEvent['status']) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const severityColors = {
  low: 'default',
  medium: 'secondary',
  high: 'destructive',
  critical: 'destructive'
} as const;

const statusColors = {
  new: 'destructive',
  investigating: 'secondary',
  resolved: 'default',
  false_positive: 'outline'
} as const;

const eventTypeIcons = {
  intrusion: AlertCircle,
  malware: Bot,
  network_anomaly: Network,
  data_breach: AlertCircle,
  phishing: AlertCircle,
  dos_attack: Network
};

export function EventsTable({ events, onEventUpdate, onRefresh, isLoading }: EventsTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredEvents = events.filter(event => {
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && event.status !== statusFilter) return false;
    if (typeFilter !== 'all' && event.event_type !== typeFilter) return false;
    return true;
  });

  const handleStatusChange = (eventId: string, newStatus: SecurityEvent['status']) => {
    onEventUpdate(eventId, newStatus);
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent({ ...selectedEvent, status: newStatus });
    }
  };

  const parseAIAnalysis = (analysis: string | undefined) => {
    if (!analysis) return null;
    try {
      return JSON.parse(analysis);
    } catch {
      return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Security Events</CardTitle>
            <CardDescription>Real-time monitoring of security incidents</CardDescription>
          </div>
          <Button onClick={onRefresh} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Event Type" />
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Source IP</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => {
              const Icon = eventTypeIcons[event.event_type] || AlertCircle;
              return (
                <TableRow key={event.id}>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityColors[event.severity]} className="capitalize">
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{event.source_ip}</TableCell>
                  <TableCell className="max-w-md truncate">{event.description}</TableCell>
                  <TableCell>
                    <Select
                      value={event.status}
                      onValueChange={(value) => handleStatusChange(event.id, value as SecurityEvent['status'])}
                    >
                      <SelectTrigger className="w-36">
                        <Badge variant={statusColors[event.status]} className="capitalize">
                          {event.status.replace('_', ' ')}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="false_positive">False Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </SheetTrigger>
                      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Event Details</SheetTitle>
                          <SheetDescription>
                            Detailed information about security event {selectedEvent?.id}
                          </SheetDescription>
                        </SheetHeader>

                        {selectedEvent && (
                          <div className="mt-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Event Type</label>
                                <p className="capitalize">{selectedEvent.event_type.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Severity</label>
                                <p>
                                  <Badge variant={severityColors[selectedEvent.severity]} className="capitalize">
                                    {selectedEvent.severity}
                                  </Badge>
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Source IP</label>
                                <p className="font-mono">{selectedEvent.source_ip}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Destination IP</label>
                                <p className="font-mono">{selectedEvent.destination_ip || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Timestamp</label>
                                <p>{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <p>
                                  <Badge variant={statusColors[selectedEvent.status]} className="capitalize">
                                    {selectedEvent.status.replace('_', ' ')}
                                  </Badge>
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <p className="mt-1 p-3 bg-gray-50 rounded border">{selectedEvent.description}</p>
                            </div>

                            {/* Tags */}
                            <div>
                              <label className="text-sm font-medium">Tags</label>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedEvent.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline">{tag}</Badge>
                                ))}
                              </div>
                            </div>

                            {/* AI Analysis */}
                            {selectedEvent.ai_analysis && (
                              <div>
                                <label className="text-sm font-medium">AI Analysis</label>
                                {(() => {
                                  const analysis = parseAIAnalysis(selectedEvent.ai_analysis);
                                  if (analysis) {
                                    return (
                                      <div className="mt-1 p-4 bg-blue-50 rounded border space-y-3">
                                        <div>
                                          <strong>Threat Type:</strong> {analysis.threat_type}
                                        </div>
                                        <div>
                                          <strong>Risk Level:</strong>
                                          <Badge className="ml-2 capitalize">{analysis.risk_level}</Badge>
                                        </div>
                                        <div>
                                          <strong>Confidence Score:</strong> {(analysis.confidence_score * 100).toFixed(1)}%
                                        </div>
                                        <div>
                                          <strong>Justification:</strong>
                                          <p className="mt-1">{analysis.severity_justification}</p>
                                        </div>
                                        <div>
                                          <strong>Recommended Actions:</strong>
                                          <ul className="mt-1 list-disc list-inside">
                                            {analysis.recommended_actions.map((action: string, index: number) => (
                                              <li key={index}>{action}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <strong>Indicators of Compromise:</strong>
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {analysis.indicators_of_compromise.map((ioc: string, index: number) => (
                                              <Badge key={index} variant="outline" className="text-xs">{ioc}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <p className="mt-1 p-3 bg-gray-50 rounded border">{selectedEvent.ai_analysis}</p>
                                    );
                                  }
                                })()}
                              </div>
                            )}

                            {/* Raw Data */}
                            <div>
                              <label className="text-sm font-medium">Raw Data</label>
                              <pre className="mt-1 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(selectedEvent.raw_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>

                    <IncidentReportButton event={event} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No events match the current filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

