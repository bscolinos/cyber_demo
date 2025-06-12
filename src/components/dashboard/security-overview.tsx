'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface SecurityOverviewProps {
  stats: {
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
  };
}

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a'
};

const EVENT_TYPE_COLORS = {
  intrusion: '#8b5cf6',
  malware: '#ef4444',
  network_anomaly: '#f59e0b',
  data_breach: '#dc2626',
  phishing: '#06b6d4',
  dos_attack: '#ec4899'
};

export function SecurityOverview({ stats }: SecurityOverviewProps) {
  const severityData = Object.entries(stats.eventsBySeverity).map(([severity, count]) => ({
    name: severity,
    value: count,
    color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#6b7280'
  }));

  const typeData = Object.entries(stats.eventsByType).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count,
    color: EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || '#6b7280'
  }));

  const threatLevel = stats.criticalEvents > 0 ? 'Critical' :
                     stats.highEvents > 5 ? 'High' :
                     stats.highEvents > 0 ? 'Medium' : 'Low';

  const threatLevelColor = stats.criticalEvents > 0 ? 'destructive' :
                          stats.highEvents > 5 ? 'destructive' :
                          stats.highEvents > 0 ? 'secondary' : 'default';

  return (
    <div className="space-y-6">
      {/* Threat Level Alert */}
      {stats.criticalEvents > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Alert:</strong> {stats.criticalEvents} critical security events require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentEvents} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={threatLevelColor}>{threatLevel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.criticalEvents} critical, {stats.highEvents} high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedEvents}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.resolvedEvents / stats.totalEvents) * 100).toFixed(1)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newEvents}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting investigation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Event Trends (7 Days)</CardTitle>
            <CardDescription>Daily security event count by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} name="Critical" />
                <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} name="High" />
                <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} name="Medium" />
                <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
            <CardDescription>Distribution of security event types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Threats */}
      <Card>
        <CardHeader>
          <CardTitle>Top Threats</CardTitle>
          <CardDescription>Most frequent security threats by type and severity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topThreats.map((threat, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="capitalize">
                    {threat.type.replace('_', ' ')}
                  </Badge>
                  <Badge
                    variant={threat.severity === 'critical' ? 'destructive' :
                           threat.severity === 'high' ? 'destructive' : 'secondary'}
                  >
                    {threat.severity}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{threat.count}</span>
                  <span className="text-sm text-muted-foreground">events</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

