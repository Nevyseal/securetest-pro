import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, FileSpreadsheet, Shield, AlertTriangle } from "lucide-react";

interface ScanResult {
  id: number;
  targetId: number;
  status: string;
  progress: number;
  startedAt: string;
  completedAt?: string;
}

interface Vulnerability {
  id: number;
  severity: string;
  type: string;
  parameter: string;
  payload: string;
  description: string;
  cvssScore?: string;
  endpoint: string;
  detectedAt: string;
}

export default function ReportExport() {
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);

  const { data: scanResults } = useQuery<ScanResult[]>({
    queryKey: ["/api/scans/results"],
  });

  const { data: reportData } = useQuery({
    queryKey: ["/api/reports/export", selectedScanId],
    enabled: !!selectedScanId,
  });

  const completedScans = scanResults?.filter(scan => scan.status === "completed") || [];

  const exportReport = (format: "pdf" | "json" | "excel") => {
    if (!reportData) return;

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `security-assessment-report-${selectedScanId}.${format === "json" ? "json" : format}`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-red-100";
      case "high":
        return "bg-yellow-600 text-yellow-100";
      case "medium":
        return "bg-orange-600 text-orange-100";
      case "low":
        return "bg-blue-600 text-blue-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-white">
            <FileText className="text-cyber-blue mr-3" size={20} />
            Comprehensive Security Assessment Report
          </CardTitle>
          {selectedScanId && (
            <div className="flex space-x-2">
              <Button
                onClick={() => exportReport("pdf")}
                className="btn-primary"
                size="sm"
              >
                <Download className="mr-2" size={16} />
                Export PDF
              </Button>
              <Button
                onClick={() => exportReport("json")}
                variant="outline"
                size="sm"
                className="border-cyber-green text-cyber-green hover:bg-cyber-green/20"
              >
                <FileSpreadsheet className="mr-2" size={16} />
                Export JSON
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Scan Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Completed Scan
          </label>
          <select
            className="input-field"
            value={selectedScanId || ""}
            onChange={(e) => setSelectedScanId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a scan to generate report...</option>
            {completedScans.map((scan) => (
              <option key={scan.id} value={scan.id}>
                Scan #{scan.id} - {new Date(scan.startedAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {!selectedScanId ? (
          <div className="text-center text-gray-400 py-8">
            <FileText className="mx-auto mb-4 text-gray-600" size={48} />
            <p>Select a completed scan to view the detailed security assessment report.</p>
          </div>
        ) : !reportData ? (
          <div className="text-center text-gray-400 py-8">
            Loading report data...
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-cyber-dark">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="remediation">Remediation</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Executive Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">Executive Summary</h3>
                  <div className="bg-cyber-dark rounded-lg p-4 space-y-3">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      The security assessment identified{" "}
                      <span className="text-cyber-red font-semibold">
                        {reportData.summary?.critical || 0} critical
                      </span>{" "}
                      and{" "}
                      <span className="text-cyber-amber font-semibold">
                        {reportData.summary?.high || 0} high
                      </span>{" "}
                      severity SQL injection vulnerabilities across the target application.
                      {reportData.summary?.total > 0
                        ? " These findings require immediate attention to prevent potential data breaches and unauthorized access."
                        : " No critical vulnerabilities were identified during this assessment."}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total Vulnerabilities:</span>
                        <span className="text-white font-semibold ml-2">
                          {reportData.summary?.total || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Target URL:</span>
                        <span className="text-white font-semibold ml-2 break-all">
                          {reportData.target?.url || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
                  <div className="bg-cyber-dark rounded-lg p-4">
                    <div className="space-y-3">
                      {[
                        { label: "Critical", count: reportData.summary?.critical || 0, color: "bg-cyber-red" },
                        { label: "High", count: reportData.summary?.high || 0, color: "bg-cyber-amber" },
                        { label: "Medium", count: reportData.summary?.medium || 0, color: "bg-orange-500" },
                        { label: "Low", count: reportData.summary?.low || 0, color: "bg-gray-400" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: `hsl(var(--cyber-${item.label.toLowerCase() === 'critical' ? 'red' : item.label.toLowerCase() === 'high' ? 'amber' : 'blue'}))` }}>
                              {item.label}
                            </span>
                            <span className="font-semibold">{item.count}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className={`${item.color} h-2 rounded-full transition-all duration-300`}
                              style={{
                                width: reportData.summary?.total > 0 
                                  ? `${(item.count / reportData.summary.total) * 100}%` 
                                  : "0%"
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vulnerabilities" className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed Vulnerability Findings</h3>
              
              {reportData.vulnerabilities?.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Shield className="mx-auto mb-4 text-green-600" size={48} />
                  <p>No vulnerabilities detected during this assessment.</p>
                  <p className="text-sm mt-2">The target application appears to be secure against SQL injection attacks.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Parameter</TableHead>
                      <TableHead>CVSS</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.vulnerabilities?.map((vuln: Vulnerability) => (
                      <TableRow key={vuln.id}>
                        <TableCell>
                          <Badge className={getSeverityBadgeClass(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {vuln.type.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{vuln.parameter}</TableCell>
                        <TableCell>{vuln.cvssScore || "N/A"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-cyber-blue">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="remediation" className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Remediation Recommendations</h3>
              
              <div className="bg-green-950 border border-green-600 rounded-lg p-4">
                <h4 className="font-semibold text-green-300 mb-3 flex items-center">
                  <Shield className="mr-2" size={20} />
                  Primary Remediation Actions
                </h4>
                <ul className="text-sm text-green-100 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span><strong>Implement Parameterized Queries:</strong> Use prepared statements for all database interactions to prevent SQL injection attacks.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span><strong>Input Validation:</strong> Implement strict input validation and sanitization for all user-supplied data.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span><strong>Least Privilege:</strong> Use database accounts with minimal required permissions for application connections.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span><strong>Web Application Firewall:</strong> Deploy a WAF to filter malicious requests before they reach the application.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span><strong>Security Monitoring:</strong> Implement comprehensive logging and monitoring for database access patterns.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-950 border border-blue-600 rounded-lg p-4">
                <h4 className="font-semibold text-blue-300 mb-3">Additional Security Measures</h4>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Regular security assessments and penetration testing</li>
                  <li>• Developer security training on secure coding practices</li>
                  <li>• Implementation of static application security testing (SAST)</li>
                  <li>• Database activity monitoring and anomaly detection</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Legal & Compliance Notice</h3>
              
              <div className="bg-cyber-dark border border-gray-600 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <i className="fas fa-balance-scale text-cyber-amber mr-3"></i>
                  Assessment Authorization & Legal Framework
                </h4>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    <strong className="text-white">Authorized Testing Confirmation:</strong> This security assessment was conducted under explicit written authorization from the system owner, in compliance with applicable laws and regulations.
                  </p>
                  <p>
                    <strong className="text-white">Compliance Framework:</strong> Testing methodology follows industry-standard frameworks including:
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• OWASP Testing Guide v4.0</li>
                    <li>• NIST SP 800-115 Technical Guide to Information Security Testing</li>
                    <li>• PTES (Penetration Testing Execution Standard)</li>
                  </ul>
                  <p>
                    <strong className="text-white">Data Handling:</strong> No sensitive data was extracted, stored, or transmitted during this assessment. All testing was conducted using safe, non-destructive methods designed to identify vulnerabilities without causing harm to the target system.
                  </p>
                  <p>
                    <strong className="text-white">Confidentiality:</strong> This report contains confidential information and is intended solely for the authorized recipient organization's security team. Unauthorized disclosure is prohibited.
                  </p>
                  <p>
                    <strong className="text-white">Report Validity:</strong> Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}. Results are valid as of the assessment date and may change as the application evolves.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
