import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScanTargetSchema, insertScanConfigSchema } from "@shared/schema";
import { z } from "zod";
import { SqlInjectionTester } from "./sqlTester";

export async function registerRoutes(app: Express): Promise<Server> {
  const sqlTester = new SqlInjectionTester(storage);

  // Create scan target
  app.post("/api/scan-targets", async (req, res) => {
    try {
      const validatedData = insertScanTargetSchema.parse(req.body);
      const target = await storage.createScanTarget(validatedData);
      res.json(target);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get all scan targets
  app.get("/api/scan-targets", async (req, res) => {
    try {
      const targets = await storage.getAllScanTargets();
      res.json(targets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch targets" });
    }
  });

  // Get scan target by id
  app.get("/api/scan-targets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const target = await storage.getScanTarget(id);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(target);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch target" });
    }
  });

  // Start vulnerability scan
  app.post("/api/scans/start", async (req, res) => {
    try {
      const schema = z.object({
        targetId: z.number(),
        injectionTypes: z.array(z.string()),
        intensityLevel: z.enum(["low", "medium", "high"]),
        requestDelay: z.number().min(100).max(10000),
        followRedirects: z.boolean().default(true),
        testCookies: z.boolean().default(false),
        logRequests: z.boolean().default(true),
      });

      const config = schema.parse(req.body);
      
      // Create scan configuration
      const scanConfig = await storage.createScanConfiguration(config);
      
      // Start the scan
      const scanResult = await sqlTester.startScan(config.targetId, scanConfig);
      
      res.json(scanResult);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid scan configuration" });
    }
  });

  // Get scan results
  app.get("/api/scans/results/:targetId", async (req, res) => {
    try {
      const targetId = parseInt(req.params.targetId);
      const result = await storage.getScanResultByTargetId(targetId);
      
      if (!result) {
        return res.status(404).json({ error: "Scan result not found" });
      }

      // Get associated vulnerabilities
      const vulnerabilities = await storage.getVulnerabilitiesByScanId(result.id);
      
      res.json({
        ...result,
        vulnerabilities
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan results" });
    }
  });

  // Get all scan results
  app.get("/api/scans/results", async (req, res) => {
    try {
      const results = await storage.getAllScanResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan results" });
    }
  });

  // Stop scan
  app.post("/api/scans/stop/:targetId", async (req, res) => {
    try {
      const targetId = parseInt(req.params.targetId);
      const result = await sqlTester.stopScan(targetId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop scan" });
    }
  });

  // Get vulnerabilities by scan ID
  app.get("/api/vulnerabilities/:scanId", async (req, res) => {
    try {
      const scanId = parseInt(req.params.scanId);
      const vulnerabilities = await storage.getVulnerabilitiesByScanId(scanId);
      res.json(vulnerabilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vulnerabilities" });
    }
  });

  // Get dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const allResults = await storage.getAllScanResults();
      const allVulnerabilities = await storage.getAllVulnerabilities();

      const stats = {
        totalScans: allResults.length,
        completedScans: allResults.filter(r => r.status === 'completed').length,
        runningScans: allResults.filter(r => r.status === 'running').length,
        criticalVulns: allVulnerabilities.filter(v => v.severity === 'critical').length,
        highVulns: allVulnerabilities.filter(v => v.severity === 'high').length,
        mediumVulns: allVulnerabilities.filter(v => v.severity === 'medium').length,
        lowVulns: allVulnerabilities.filter(v => v.severity === 'low').length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Export report
  app.get("/api/reports/export/:scanId", async (req, res) => {
    try {
      const scanId = parseInt(req.params.scanId);
      const scanResult = await storage.getScanResult(scanId);
      const vulnerabilities = await storage.getVulnerabilitiesByScanId(scanId);
      
      if (!scanResult) {
        return res.status(404).json({ error: "Scan not found" });
      }

      const target = await storage.getScanTarget(scanResult.targetId);
      const config = await storage.getScanConfiguration(scanResult.targetId);

      const report = {
        scan: scanResult,
        target,
        configuration: config,
        vulnerabilities,
        generatedAt: new Date().toISOString(),
        summary: {
          total: vulnerabilities.length,
          critical: vulnerabilities.filter(v => v.severity === 'critical').length,
          high: vulnerabilities.filter(v => v.severity === 'high').length,
          medium: vulnerabilities.filter(v => v.severity === 'medium').length,
          low: vulnerabilities.filter(v => v.severity === 'low').length,
        }
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
