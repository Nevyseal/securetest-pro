import { 
  ScanTarget, 
  InsertScanTarget, 
  ScanConfiguration, 
  InsertScanConfiguration,
  ScanResult,
  InsertScanResult,
  Vulnerability,
  InsertVulnerability 
} from "@shared/schema";

export interface IStorage {
  // Scan Targets
  createScanTarget(target: InsertScanTarget): Promise<ScanTarget>;
  getScanTarget(id: number): Promise<ScanTarget | undefined>;
  getAllScanTargets(): Promise<ScanTarget[]>;
  
  // Scan Configurations
  createScanConfiguration(config: InsertScanConfiguration): Promise<ScanConfiguration>;
  getScanConfiguration(targetId: number): Promise<ScanConfiguration | undefined>;
  
  // Scan Results
  createScanResult(result: InsertScanResult): Promise<ScanResult>;
  getScanResult(id: number): Promise<ScanResult | undefined>;
  getScanResultByTargetId(targetId: number): Promise<ScanResult | undefined>;
  updateScanResult(id: number, updates: Partial<ScanResult>): Promise<ScanResult>;
  getAllScanResults(): Promise<ScanResult[]>;
  
  // Vulnerabilities
  createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability>;
  getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]>;
  getAllVulnerabilities(): Promise<Vulnerability[]>;
}

export class MemStorage implements IStorage {
  private scanTargets: Map<number, ScanTarget>;
  private scanConfigurations: Map<number, ScanConfiguration>;
  private scanResults: Map<number, ScanResult>;
  private vulnerabilities: Map<number, Vulnerability>;
  private currentTargetId: number;
  private currentConfigId: number;
  private currentResultId: number;
  private currentVulnId: number;

  constructor() {
    this.scanTargets = new Map();
    this.scanConfigurations = new Map();
    this.scanResults = new Map();
    this.vulnerabilities = new Map();
    this.currentTargetId = 1;
    this.currentConfigId = 1;
    this.currentResultId = 1;
    this.currentVulnId = 1;
  }

  async createScanTarget(insertTarget: InsertScanTarget): Promise<ScanTarget> {
    const id = this.currentTargetId++;
    const target: ScanTarget = {
      ...insertTarget,
      id,
      createdAt: new Date(),
    };
    this.scanTargets.set(id, target);
    return target;
  }

  async getScanTarget(id: number): Promise<ScanTarget | undefined> {
    return this.scanTargets.get(id);
  }

  async getAllScanTargets(): Promise<ScanTarget[]> {
    return Array.from(this.scanTargets.values());
  }

  async createScanConfiguration(insertConfig: InsertScanConfiguration): Promise<ScanConfiguration> {
    const id = this.currentConfigId++;
    const config: ScanConfiguration = {
      ...insertConfig,
      id,
    };
    this.scanConfigurations.set(id, config);
    return config;
  }

  async getScanConfiguration(targetId: number): Promise<ScanConfiguration | undefined> {
    return Array.from(this.scanConfigurations.values()).find(
      config => config.targetId === targetId
    );
  }

  async createScanResult(insertResult: InsertScanResult): Promise<ScanResult> {
    const id = this.currentResultId++;
    const result: ScanResult = {
      ...insertResult,
      id,
      startedAt: new Date(),
      completedAt: null,
    };
    this.scanResults.set(id, result);
    return result;
  }

  async getScanResult(id: number): Promise<ScanResult | undefined> {
    return this.scanResults.get(id);
  }

  async getScanResultByTargetId(targetId: number): Promise<ScanResult | undefined> {
    return Array.from(this.scanResults.values()).find(
      result => result.targetId === targetId
    );
  }

  async updateScanResult(id: number, updates: Partial<ScanResult>): Promise<ScanResult> {
    const existing = this.scanResults.get(id);
    if (!existing) {
      throw new Error(`Scan result with id ${id} not found`);
    }
    
    const updated: ScanResult = {
      ...existing,
      ...updates,
      completedAt: updates.status === 'completed' ? new Date() : existing.completedAt,
    };
    
    this.scanResults.set(id, updated);
    return updated;
  }

  async getAllScanResults(): Promise<ScanResult[]> {
    return Array.from(this.scanResults.values());
  }

  async createVulnerability(insertVuln: InsertVulnerability): Promise<Vulnerability> {
    const id = this.currentVulnId++;
    const vulnerability: Vulnerability = {
      ...insertVuln,
      id,
      detectedAt: new Date(),
    };
    this.vulnerabilities.set(id, vulnerability);
    return vulnerability;
  }

  async getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values()).filter(
      vuln => vuln.scanId === scanId
    );
  }

  async getAllVulnerabilities(): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values());
  }
}

export const storage = new MemStorage();
