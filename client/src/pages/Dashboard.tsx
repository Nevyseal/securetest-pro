import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, User, Clock } from "lucide-react";
import TargetConfiguration from "@/components/TargetConfiguration";
import ScanProgress from "@/components/ScanProgress";
import VulnerabilityResults from "@/components/VulnerabilityResults";
import ReportExport from "@/components/ReportExport";
import EthicsDisclaimer from "@/components/EthicsDisclaimer";

interface DashboardStats {
  totalScans: number;
  completedScans: number;
  runningScans: number;
  criticalVulns: number;
  highVulns: number;
  mediumVulns: number;
  lowVulns: number;
}

export default function Dashboard() {
  const [activeScanId, setActiveScanId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  return (
    <div className="min-h-screen bg-cyber-dark text-gray-100">
      {/* Header */}
      <header className="bg-cyber-surface border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cyber-blue rounded-lg flex items-center justify-center">
              <Shield className="text-cyber-dark" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SecureTest Pro</h1>
              <p className="text-xs text-gray-400">Authorized Penetration Testing Suite</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Security Analyst</p>
              <p className="text-xs text-gray-400">
                Session: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="text-gray-300" size={16} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-cyber-surface border-r border-gray-700 overflow-y-auto">
          <nav className="p-4 space-y-2">
            <div className="mb-6">
              <EthicsDisclaimer />
            </div>

            <a href="#" className="sidebar-link-active">
              <i className="fas fa-tachometer-alt w-5"></i>
              <span className="font-medium">Dashboard</span>
            </a>
            
            <a href="#" className="sidebar-link">
              <i className="fas fa-crosshairs w-5"></i>
              <span>Target Configuration</span>
            </a>
            
            <a href="#" className="sidebar-link">
              <i className="fas fa-bug w-5"></i>
              <span>Vulnerability Scanner</span>
            </a>
            
            <a href="#" className="sidebar-link">
              <i className="fas fa-file-alt w-5"></i>
              <span>Reports</span>
            </a>
            
            <a href="#" className="sidebar-link">
              <i className="fas fa-cog w-5"></i>
              <span>Settings</span>
            </a>

            <div className="border-t border-gray-700 pt-4 mt-6">
              <div className="text-xs text-gray-400 mb-2">COMPLIANCE</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <i className="fas fa-check-circle text-cyber-green"></i>
                  <span>OWASP Compliant</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <i className="fas fa-check-circle text-cyber-green"></i>
                  <span>Ethical Guidelines</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <i className="fas fa-check-circle text-cyber-green"></i>
                  <span>Safe Testing Mode</span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Ethics Banner */}
          <div className="bg-gradient-to-r from-cyber-amber/20 to-cyber-red/20 border-b border-cyber-amber/30 px-6 py-3">
            <div className="flex items-center space-x-3">
              <i className="fas fa-gavel text-cyber-amber"></i>
              <div>
                <h3 className="font-semibold text-cyber-amber">Ethical Use Required</h3>
                <p className="text-xs text-gray-300">
                  Ensure you have explicit written authorization before testing any target system. 
                  Unauthorized access is illegal and unethical.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="cyber-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {statsLoading ? "..." : stats?.totalScans || 0}
                    </p>
                    <p className="text-sm text-gray-400">Total Scans</p>
                  </div>
                  <div className="w-12 h-12 bg-cyber-blue/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-search text-cyber-blue"></i>
                  </div>
                </div>
              </div>
              
              <div className="cyber-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-cyber-red">
                      {statsLoading ? "..." : stats?.criticalVulns || 0}
                    </p>
                    <p className="text-sm text-gray-400">Critical Vulnerabilities</p>
                  </div>
                  <div className="w-12 h-12 bg-cyber-red/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-cyber-red" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="cyber-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-cyber-amber">
                      {statsLoading ? "..." : (stats?.highVulns || 0) + (stats?.mediumVulns || 0)}
                    </p>
                    <p className="text-sm text-gray-400">High/Medium Vulnerabilities</p>
                  </div>
                  <div className="w-12 h-12 bg-cyber-amber/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-circle text-cyber-amber"></i>
                  </div>
                </div>
              </div>
              
              <div className="cyber-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-cyber-green">
                      {statsLoading ? "..." : stats?.completedScans || 0}
                    </p>
                    <p className="text-sm text-gray-400">Completed Scans</p>
                  </div>
                  <div className="w-12 h-12 bg-cyber-green/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-cyber-green"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Target Configuration */}
              <TargetConfiguration onScanStarted={setActiveScanId} />

              {/* Live Results */}
              <VulnerabilityResults scanId={activeScanId} />
            </div>

            {/* Scan Progress */}
            {activeScanId && (
              <div className="mt-8">
                <ScanProgress scanId={activeScanId} />
              </div>
            )}

            {/* Detailed Report Section */}
            <div className="mt-8">
              <ReportExport />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
