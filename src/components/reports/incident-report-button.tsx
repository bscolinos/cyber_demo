'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SecurityEvent } from '@/lib/database';
import { reportGenerator } from '@/lib/export-utils';
import { FileText, Loader2 } from 'lucide-react';

interface IncidentReportButtonProps {
  event: SecurityEvent;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function IncidentReportButton({ event, variant = 'outline', size = 'sm' }: IncidentReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      await reportGenerator.generateIncidentReport(event);
    } catch (error) {
      console.error('Failed to generate incident report:', error);
      alert('Failed to generate incident report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateReport}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className="flex items-center space-x-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          <span>Incident Report</span>
        </>
      )}
    </Button>
  );
}

