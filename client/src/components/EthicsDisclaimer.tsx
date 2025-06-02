import { AlertTriangle } from "lucide-react";

export default function EthicsDisclaimer() {
  return (
    <div className="bg-cyber-red/20 border border-cyber-red/50 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle className="text-cyber-red" size={16} />
        <span className="text-cyber-red font-semibold text-sm">AUTHORIZED USE ONLY</span>
      </div>
      <p className="text-xs text-gray-300">
        This tool is for authorized penetration testing only. Unauthorized use is illegal and unethical.
      </p>
    </div>
  );
}
