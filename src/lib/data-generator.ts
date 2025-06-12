import type { SecurityEvent } from './database';
import { v4 as uuidv4 } from 'uuid';

export class CybersecurityDataGenerator {
  private readonly maliciousIPs = [
    '192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.5',
    '198.51.100.10', '192.0.2.15', '185.199.108.153', '140.82.112.4'
  ];

  private readonly internalIPs = [
    '192.168.1.10', '192.168.1.20', '10.0.0.5', '172.16.0.10',
    '192.168.0.100', '10.1.1.50', '172.31.0.25'
  ];

  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'curl/7.68.0',
    'python-requests/2.25.1',
    'Wget/1.20.3',
    'Nikto/2.1.6'
  ];

  private readonly malwareNames = [
    'Trojan.GenKryptik', 'Win32.Conficker', 'Backdoor.Poison', 'Ransomware.Crypto',
    'Worm.Mydoom', 'Spyware.Agent', 'Rootkit.ZeroAccess', 'Adware.Generic'
  ];

  private readonly attackVectors = [
    'SQL Injection', 'Cross-Site Scripting', 'Buffer Overflow', 'Privilege Escalation',
    'Man-in-the-Middle', 'Phishing', 'Social Engineering', 'Zero-Day Exploit'
  ];

  generateIntrusionEvent(): Omit<SecurityEvent, 'id'> {
    const sourceIP = this.getRandomElement(this.maliciousIPs);
    const targetIP = this.getRandomElement(this.internalIPs);
    const userAgent = this.getRandomElement(this.userAgents);
    const attackVector = this.getRandomElement(this.attackVectors);

    const attempts = Math.floor(Math.random() * 50) + 1;
    const severity = attempts > 30 ? 'critical' : attempts > 15 ? 'high' : attempts > 5 ? 'medium' : 'low';

    return {
      timestamp: new Date(),
      event_type: 'intrusion',
      severity: severity as SecurityEvent['severity'],
      source_ip: sourceIP,
      destination_ip: targetIP,
      description: `${attempts} failed authentication attempts detected from ${sourceIP} targeting ${targetIP} using ${attackVector}`,
      raw_data: {
        attempts: attempts,
        user_agent: userAgent,
        attack_vector: attackVector,
        protocols: ['SSH', 'HTTP', 'FTP'][Math.floor(Math.random() * 3)],
        duration_seconds: Math.floor(Math.random() * 300) + 10,
        payload_size: Math.floor(Math.random() * 10000) + 100,
        geographic_origin: this.getRandomCountry(),
        request_headers: {
          'User-Agent': userAgent,
          'X-Forwarded-For': sourceIP,
          'Accept': 'text/html,application/xhtml+xml'
        }
      },
      status: 'new',
      tags: ['brute_force', 'authentication_failure', attackVector.toLowerCase().replace(/[^a-z0-9]/g, '_')]
    };
  }

  generateMalwareEvent(): Omit<SecurityEvent, 'id'> {
    const malware = this.getRandomElement(this.malwareNames);
    const sourceIP = this.getRandomElement(this.internalIPs);
    const severity = ['critical', 'high'][Math.floor(Math.random() * 2)] as SecurityEvent['severity'];

    return {
      timestamp: new Date(),
      event_type: 'malware',
      severity,
      source_ip: sourceIP,
      description: `Malware detected: ${malware} found on system ${sourceIP}`,
      raw_data: {
        malware_name: malware,
        file_path: `/tmp/${malware.toLowerCase().replace(/[^a-z0-9]/g, '_')}.exe`,
        file_hash: this.generateHash(),
        process_id: Math.floor(Math.random() * 10000) + 1000,
        parent_process: 'explorer.exe',
        network_connections: [
          {
            remote_ip: this.getRandomElement(this.maliciousIPs),
            port: 443,
            protocol: 'HTTPS'
          }
        ],
        file_size: Math.floor(Math.random() * 5000000) + 100000,
        creation_time: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        detection_engine: 'Real-time Protection',
        threat_level: severity
      },
      status: 'new',
      tags: ['malware', 'file_infection', malware.split('.')[0].toLowerCase()]
    };
  }

  generateNetworkAnomalyEvent(): Omit<SecurityEvent, 'id'> {
    const sourceIP = this.getRandomElement(this.internalIPs);
    const destIP = this.getRandomElement(this.maliciousIPs);
    const dataVolume = Math.floor(Math.random() * 1000000) + 10000;
    const severity = dataVolume > 500000 ? 'high' : dataVolume > 100000 ? 'medium' : 'low';

    return {
      timestamp: new Date(),
      event_type: 'network_anomaly',
      severity: severity as SecurityEvent['severity'],
      source_ip: sourceIP,
      destination_ip: destIP,
      description: `Abnormal data transfer detected: ${(dataVolume / 1024 / 1024).toFixed(2)}MB transferred from ${sourceIP} to ${destIP}`,
      raw_data: {
        bytes_transferred: dataVolume,
        duration_minutes: Math.floor(Math.random() * 60) + 1,
        protocol: 'HTTPS',
        port: 443,
        session_count: Math.floor(Math.random() * 20) + 1,
        packet_count: Math.floor(dataVolume / 1500),
        flags: ['SYN', 'ACK', 'PSH', 'FIN'],
        geographic_destination: this.getRandomCountry(),
        encryption_type: 'TLS 1.3',
        bandwidth_utilization: Math.floor(Math.random() * 100) + 1
      },
      status: 'new',
      tags: ['data_exfiltration', 'network_anomaly', 'high_volume']
    };
  }

  generateDataBreachEvent(): Omit<SecurityEvent, 'id'> {
    const sourceIP = this.getRandomElement(this.maliciousIPs);
    const recordCount = Math.floor(Math.random() * 10000) + 100;

    return {
      timestamp: new Date(),
      event_type: 'data_breach',
      severity: 'critical',
      source_ip: sourceIP,
      description: `Potential data breach detected: ${recordCount} sensitive records accessed by unauthorized user from ${sourceIP}`,
      raw_data: {
        records_accessed: recordCount,
        data_types: ['PII', 'Financial', 'Healthcare', 'Credentials'],
        database_accessed: 'customer_db',
        query_type: 'SELECT',
        user_account: 'admin_temp',
        access_method: 'SQL Injection',
        tables_affected: ['users', 'payments', 'personal_info'],
        time_to_detection: Math.floor(Math.random() * 300) + 30,
        data_classification: 'Highly Sensitive'
      },
      status: 'new',
      tags: ['data_breach', 'sql_injection', 'pii_exposure', 'critical_incident']
    };
  }

  generatePhishingEvent(): Omit<SecurityEvent, 'id'> {
    const targetIP = this.getRandomElement(this.internalIPs);
    const severity = ['medium', 'high'][Math.floor(Math.random() * 2)] as SecurityEvent['severity'];

    return {
      timestamp: new Date(),
      event_type: 'phishing',
      severity,
      source_ip: targetIP,
      description: `Phishing attempt detected: Malicious email clicked by user at ${targetIP}`,
      raw_data: {
        email_subject: this.getRandomPhishingSubject(),
        sender_email: this.generateFakeEmail(),
        recipient_count: Math.floor(Math.random() * 50) + 1,
        attachment_hash: this.generateHash(),
        malicious_url: `https://fake-${Math.random().toString(36).substr(2, 8)}.com/login`,
        click_timestamp: new Date().toISOString(),
        user_agent: this.getRandomElement(this.userAgents),
        email_headers: {
          'Return-Path': this.generateFakeEmail(),
          'X-Originating-IP': this.getRandomElement(this.maliciousIPs)
        }
      },
      status: 'new',
      tags: ['phishing', 'social_engineering', 'email_threat']
    };
  }

  generateDosAttackEvent(): Omit<SecurityEvent, 'id'> {
    const sourceIP = this.getRandomElement(this.maliciousIPs);
    const targetIP = this.getRandomElement(this.internalIPs);
    const requestCount = Math.floor(Math.random() * 10000) + 1000;

    return {
      timestamp: new Date(),
      event_type: 'dos_attack',
      severity: requestCount > 5000 ? 'critical' : 'high',
      source_ip: sourceIP,
      destination_ip: targetIP,
      description: `DDoS attack detected: ${requestCount} requests per second from ${sourceIP} targeting ${targetIP}`,
      raw_data: {
        requests_per_second: requestCount,
        attack_duration: Math.floor(Math.random() * 600) + 60,
        attack_type: ['HTTP Flood', 'SYN Flood', 'UDP Flood'][Math.floor(Math.random() * 3)],
        bot_count: Math.floor(Math.random() * 1000) + 10,
        target_service: ['HTTP', 'HTTPS', 'DNS'][Math.floor(Math.random() * 3)],
        peak_bandwidth: Math.floor(Math.random() * 1000) + 100,
        geographic_sources: [this.getRandomCountry(), this.getRandomCountry(), this.getRandomCountry()]
      },
      status: 'new',
      tags: ['ddos', 'dos_attack', 'service_disruption']
    };
  }

  generateRandomEvent(): Omit<SecurityEvent, 'id'> {
    const eventGenerators = [
      () => this.generateIntrusionEvent(),
      () => this.generateMalwareEvent(),
      () => this.generateNetworkAnomalyEvent(),
      () => this.generateDataBreachEvent(),
      () => this.generatePhishingEvent(),
      () => this.generateDosAttackEvent()
    ];

    const generator = this.getRandomElement(eventGenerators);
    return generator();
  }

  generateBatchEvents(count: number): Array<Omit<SecurityEvent, 'id'>> {
    return Array.from({ length: count }, () => this.generateRandomEvent());
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private generateHash(): string {
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private getRandomCountry(): string {
    const countries = [
      'Russia', 'China', 'North Korea', 'Iran', 'Romania', 'Brazil',
      'Nigeria', 'India', 'Vietnam', 'Pakistan'
    ];
    return this.getRandomElement(countries);
  }

  private getRandomPhishingSubject(): string {
    const subjects = [
      'Urgent: Your Account Will Be Suspended',
      'Invoice #12345 - Payment Required',
      'Security Alert: Suspicious Activity Detected',
      'Your Package Could Not Be Delivered',
      'Important: Update Your Banking Information',
      'COVID-19 Relief Fund - Claim Your Money'
    ];
    return this.getRandomElement(subjects);
  }

  private generateFakeEmail(): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'fake-bank.com', 'temp-mail.org'];
    const names = ['john', 'admin', 'support', 'security', 'noreply', 'urgent'];
    return `${this.getRandomElement(names)}${Math.floor(Math.random() * 1000)}@${this.getRandomElement(domains)}`;
  }
}

export const dataGenerator = new CybersecurityDataGenerator();

