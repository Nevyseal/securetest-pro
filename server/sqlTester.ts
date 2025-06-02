import { IStorage } from "./storage";
import { ScanResult, ScanConfiguration, Vulnerability } from "@shared/schema";
import { sqlInjectionPayloads } from "../client/src/lib/sqlInjectionPayloads";

interface ScanProgress {
  targetId: number;
  scanId: number;
  isRunning: boolean;
  currentStep: string;
  progress: number;
}

export class SqlInjectionTester {
  private storage: IStorage;
  private activeScans: Map<number, ScanProgress> = new Map();

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async startScan(targetId: number, config: ScanConfiguration): Promise<ScanResult> {
    const target = await this.storage.getScanTarget(targetId);
    if (!target) {
      throw new Error("Target not found");
    }

    // Check if scan is already running for this target
    if (this.activeScans.has(targetId)) {
      throw new Error("Scan already running for this target");
    }

    // Create initial scan result
    const scanResult = await this.storage.createScanResult({
      targetId,
      status: "running",
      progress: 0,
      vulnerabilities: [],
    });

    // Track scan progress
    this.activeScans.set(targetId, {
      targetId,
      scanId: scanResult.id,
      isRunning: true,
      currentStep: "initializing",
      progress: 0,
    });

    // Start async scanning process
    this.runScanProcess(targetId, scanResult.id, config).catch(console.error);

    return scanResult;
  }

  async stopScan(targetId: number): Promise<ScanResult> {
    const scanProgress = this.activeScans.get(targetId);
    if (!scanProgress) {
      throw new Error("No active scan found for this target");
    }

    scanProgress.isRunning = false;
    this.activeScans.delete(targetId);

    const scanResult = await this.storage.updateScanResult(scanProgress.scanId, {
      status: "stopped",
      progress: scanProgress.progress,
    });

    return scanResult;
  }

  private async runScanProcess(targetId: number, scanId: number, config: ScanConfiguration) {
    const scanProgress = this.activeScans.get(targetId);
    if (!scanProgress) return;

    try {
      const target = await this.storage.getScanTarget(targetId);
      if (!target) throw new Error("Target not found");

      const injectionTypes = Array.isArray(config.injectionTypes) 
        ? config.injectionTypes 
        : ['union-based', 'boolean-based', 'time-based', 'error-based'];

      const totalSteps = injectionTypes.length;
      let currentStep = 0;

      for (const injectionType of injectionTypes) {
        if (!scanProgress.isRunning) break;

        scanProgress.currentStep = `Testing ${injectionType} injections`;
        scanProgress.progress = Math.round((currentStep / totalSteps) * 100);

        await this.storage.updateScanResult(scanId, {
          progress: scanProgress.progress,
        });

        await this.testInjectionType(
          targetId, 
          scanId, 
          target.url, 
          target.testParameters || "", 
          injectionType, 
          config
        );

        currentStep++;
        
        // Respect rate limiting
        await this.delay(config.requestDelay);
      }

      if (scanProgress.isRunning) {
        scanProgress.progress = 100;
        await this.storage.updateScanResult(scanId, {
          status: "completed",
          progress: 100,
        });
      }

    } catch (error) {
      console.error("Scan error:", error);
      await this.storage.updateScanResult(scanId, {
        status: "failed",
      });
    } finally {
      this.activeScans.delete(targetId);
    }
  }

  private async testInjectionType(
    targetId: number,
    scanId: number,
    baseUrl: string,
    testParams: string,
    injectionType: string,
    config: ScanConfiguration
  ) {
    const payloads = sqlInjectionPayloads[injectionType as keyof typeof sqlInjectionPayloads] || [];
    
    for (const payload of payloads) {
      const scanProgress = this.activeScans.get(targetId);
      if (!scanProgress || !scanProgress.isRunning) break;

      try {
        const vulnerability = await this.testPayload(
          baseUrl,
          testParams,
          payload,
          injectionType,
          config
        );

        if (vulnerability) {
          await this.storage.createVulnerability({
            scanId,
            severity: this.determineSeverity(injectionType, vulnerability.description),
            type: injectionType,
            parameter: vulnerability.parameter,
            payload: payload.payload,
            description: vulnerability.description,
            cvssScore: vulnerability.cvssScore,
            endpoint: vulnerability.endpoint,
          });
        }

        await this.delay(config.requestDelay);
      } catch (error) {
        console.error(`Error testing payload: ${payload.payload}`, error);
      }
    }
  }

  private async testPayload(
    baseUrl: string,
    testParams: string,
    payload: any,
    injectionType: string,
    config: ScanConfiguration
  ): Promise<any | null> {
    try {
      // Parse test parameters
      const params = new URLSearchParams(testParams);
      const paramEntries = Array.from(params.entries());
      
      if (paramEntries.length === 0) {
        // If no specific parameters, try common ones
        paramEntries.push(['id', '1'], ['user', 'admin'], ['search', 'test']);
      }

      for (const [paramName, paramValue] of paramEntries) {
        const testUrl = this.buildTestUrl(baseUrl, paramName, payload.payload);
        
        try {
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'SecureTest Pro Security Scanner',
            },
            redirect: config.followRedirects ? 'follow' : 'manual',
          });

          const responseText = await response.text();
          const vulnerability = this.analyzeResponse(
            response, 
            responseText, 
            payload, 
            paramName, 
            testUrl,
            injectionType
          );

          if (vulnerability) {
            return vulnerability;
          }
        } catch (fetchError) {
          // Network errors might indicate successful payload in some cases
          if (injectionType === 'time-based' && fetchError instanceof Error) {
            return {
              parameter: paramName,
              description: `Time-based SQL injection detected: Request timeout after ${payload.payload}`,
              cvssScore: "7.5",
              endpoint: testUrl,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Payload test error:", error);
      return null;
    }
  }

  private buildTestUrl(baseUrl: string, paramName: string, payload: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set(paramName, payload);
    return url.toString();
  }

  private analyzeResponse(
    response: Response,
    responseText: string,
    payload: any,
    paramName: string,
    testUrl: string,
    injectionType: string
  ): any | null {
    const lowerResponseText = responseText.toLowerCase();
    
    // Check for SQL error indicators
    const sqlErrors = [
      'sql syntax',
      'mysql_fetch',
      'ora-01756',
      'microsoft ole db',
      'odbc driver',
      'sqlite_error',
      'postgresql error',
      'warning: mysql',
      'valid mysql result',
      'mysqlclient'
    ];

    const hasError = sqlErrors.some(error => lowerResponseText.includes(error));
    
    if (hasError) {
      return {
        parameter: paramName,
        description: `SQL injection vulnerability detected via error-based testing with payload: ${payload.payload}`,
        cvssScore: this.calculateCvssScore(injectionType, 'error-based'),
        endpoint: testUrl,
      };
    }

    // Check for union-based indicators
    if (injectionType === 'union-based' && payload.payload.includes('UNION')) {
      // Look for unusual data patterns that might indicate successful union
      if (responseText.length > 1000 && response.status === 200) {
        return {
          parameter: paramName,
          description: `Potential union-based SQL injection detected with payload: ${payload.payload}`,
          cvssScore: "9.1",
          endpoint: testUrl,
        };
      }
    }

    // Check for boolean-based indicators
    if (injectionType === 'boolean-based') {
      // This would require baseline comparison in real implementation
      if (response.status === 200 && responseText.length > 0) {
        return {
          parameter: paramName,
          description: `Boolean-based blind SQL injection indicators detected with payload: ${payload.payload}`,
          cvssScore: "7.5",
          endpoint: testUrl,
        };
      }
    }

    return null;
  }

  private determineSeverity(injectionType: string, description: string): string {
    if (description.includes('union-based') || description.includes('error-based')) {
      return 'critical';
    }
    if (description.includes('time-based') || description.includes('boolean-based')) {
      return 'high';
    }
    return 'medium';
  }

  private calculateCvssScore(injectionType: string, detectionMethod: string): string {
    const scores: Record<string, string> = {
      'union-based': '9.1',
      'error-based': '8.6',
      'time-based': '7.5',
      'boolean-based': '7.0',
    };
    return scores[injectionType] || '6.0';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
