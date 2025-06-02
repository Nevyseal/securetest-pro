import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Crosshair, Play, Loader2 } from "lucide-react";

const targetConfigSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  authToken: z.string().optional(),
  testParameters: z.string().optional(),
  injectionTypes: z.array(z.string()).min(1, "Select at least one injection type"),
  intensityLevel: z.enum(["low", "medium", "high"]),
  requestDelay: z.number().min(100).max(10000),
  followRedirects: z.boolean(),
  testCookies: z.boolean(),
  logRequests: z.boolean(),
});

type TargetConfigForm = z.infer<typeof targetConfigSchema>;

interface TargetConfigurationProps {
  onScanStarted: (scanId: number) => void;
}

export default function TargetConfiguration({ onScanStarted }: TargetConfigurationProps) {
  const { toast } = useToast();
  const [requestDelay, setRequestDelay] = useState([1000]);

  const form = useForm<TargetConfigForm>({
    resolver: zodResolver(targetConfigSchema),
    defaultValues: {
      url: "",
      authToken: "",
      testParameters: "",
      injectionTypes: ["union-based", "boolean-based"],
      intensityLevel: "medium",
      requestDelay: 1000,
      followRedirects: true,
      testCookies: false,
      logRequests: true,
    },
  });

  const createTargetMutation = useMutation({
    mutationFn: async (data: { url: string; authToken?: string; testParameters?: string }) => {
      const response = await apiRequest("POST", "/api/scan-targets", data);
      return response.json();
    },
  });

  const startScanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/scans/start", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Scan Started",
        description: "Vulnerability assessment has been initiated successfully.",
      });
      onScanStarted(data.id);
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to start vulnerability scan.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TargetConfigForm) => {
    try {
      // First create the target
      const target = await createTargetMutation.mutateAsync({
        url: data.url,
        authToken: data.authToken,
        testParameters: data.testParameters,
      });

      // Then start the scan
      await startScanMutation.mutateAsync({
        targetId: target.id,
        injectionTypes: data.injectionTypes,
        intensityLevel: data.intensityLevel,
        requestDelay: data.requestDelay,
        followRedirects: data.followRedirects,
        testCookies: data.testCookies,
        logRequests: data.logRequests,
      });
    } catch (error) {
      console.error("Error starting scan:", error);
    }
  };

  const isLoading = createTargetMutation.isPending || startScanMutation.isPending;

  return (
    <div className="cyber-card">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Crosshair className="text-cyber-blue mr-3" size={20} />
          Target Configuration
        </h2>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Target URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="input-field"
                      placeholder="https://example.com"
                      type="url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Authorization Token</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="input-field"
                      placeholder="Valid authorization required"
                      type="password"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400">Required: Proof of authorized testing</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="testParameters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Test Parameters</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="input-field"
                      placeholder="id=1&user=admin&category=electronics"
                      rows={3}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400">URL parameters or form data to test</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="injectionTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Test Parameters</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {["union-based", "boolean-based", "time-based", "error-based"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, type]);
                            } else {
                              field.onChange(field.value.filter((t) => t !== type));
                            }
                          }}
                        />
                        <label className="text-sm capitalize">{type}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="intensityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Intensity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Select intensity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low (Stealth)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Aggressive)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestDelay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">
                      Rate Limiting ({requestDelay[0]}ms delay)
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={100}
                        max={5000}
                        step={100}
                        value={requestDelay}
                        onValueChange={(value) => {
                          setRequestDelay(value);
                          field.onChange(value[0]);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>100ms</span>
                      <span className="text-cyber-blue font-medium">Safe</span>
                      <span>5000ms</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-6">
              <FormField
                control={form.control}
                name="followRedirects"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm">Follow redirects</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testCookies"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm">Test cookies</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logRequests"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm">Log all requests</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Play size={20} />
              )}
              <span>{isLoading ? "Starting Assessment..." : "Start Security Assessment"}</span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
