import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity } from "lucide-react";

interface ScanProgressProps {
  scanId: number;
}

interface ScanResult {
  id: number;
  targetId: number;
  status: string;
  progress: number;
  vulnerabilities: any[];
  startedAt: string;
  completedAt?: string;
}

export default function ScanProgress({ scanId }: ScanProgressProps) {
  const { data: scanResult, isLoading } = useQuery<ScanResult>({
    queryKey: ["/api/scans/results", scanId],
    refetchInterval: scanId ? 2000 : false, // Poll every 2 seconds if scanId exists
    enabled: !!scanId,
  });

  if (isLoading || !scanResult) {
    return (
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <TrendingUp className="text-purple-500 mr-3" size={20} />
            Scan Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">Loading scan progress...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-600 text-blue-100";
      case "completed":
        return "bg-green-600 text-green-100";
      case "failed":
        return "bg-red-600 text-red-100";
      case "stopped":
        return "bg-yellow-600 text-yellow-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { name: "Union-based Detection", completed: scanResult.progress > 25 },
      { name: "Boolean-based Detection", completed: scanResult.progress > 50 },
      { name: "Time-based Detection", completed: scanResult.progress > 75 },
      { name: "Error-based Detection", completed: scanResult.progress >= 100 },
    ];
    return steps;
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <TrendingUp className="text-purple-500 mr-3" size={20} />
            Scan Progress
          </div>
          <Badge className={getStatusColor(scanResult.status)}>
            {scanResult.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Overall Progress</span>
            <span className="text-cyber-blue">{scanResult.progress}%</span>
          </div>
          <Progress value={scanResult.progress} className="w-full h-3" />
        </div>

        {/* Step-by-step Progress */}
        <div className="space-y-4">
          {getProgressSteps().map((step, index) => (
            <div key={step.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{step.name}</span>
                <span className={step.completed ? "text-green-400" : "text-gray-400"}>
                  {step.completed ? "Completed" : "Pending"}
                </span>
              </div>
              <div className="w-full bg-cyber-surface rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step.completed ? "bg-green-500" : "bg-gray-500"
                  }`}
                  style={{ width: step.completed ? "100%" : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Current Activity */}
        {scanResult.status === "running" && (
          <div className="p-4 bg-cyber-surface rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center">
                <Activity className="text-cyber-blue mr-2" size={16} />
                Current Test:
              </span>
              <span className="text-xs text-gray-400">
                Request #{Math.floor((scanResult.progress / 100) * 300)}/300
              </span>
            </div>
            <code className="text-xs font-mono text-green-400 block">
              Testing SQL injection vectors on target parameters...
            </code>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-red">
              {scanResult.vulnerabilities?.filter((v: any) => v.severity === "critical").length || 0}
            </div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-amber">
              {scanResult.vulnerabilities?.filter((v: any) => 
                v.severity === "high" || v.severity === "medium"
              ).length || 0}
            </div>
            <div className="text-xs text-gray-400">High/Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-green">
              {scanResult.vulnerabilities?.filter((v: any) => 
                v.severity === "low" || v.severity === "info"
              ).length || 0}
            </div>
            <div className="text-xs text-gray-400">Low/Info</div>
          </div>
        </div>

        {/* Scan Time */}
        <div className="text-xs text-gray-400 text-center">
          Started: {new Date(scanResult.startedAt).toLocaleString()}
          {scanResult.completedAt && (
            <span className="block">
              Completed: {new Date(scanResult.completedAt).toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
