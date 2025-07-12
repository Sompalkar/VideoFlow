"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/config/api";

export default function YouTubeCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`YouTube authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received from YouTube");
        return;
      }

      try {
        const response = await apiClient.post(
          "/youtube/callback",
          { code },
          undefined,
          { withCredentials: true }
        );

        if (response.success) {
          setStatus("success");
          setMessage("YouTube connected successfully!");

          // Redirect to YouTube page after 2 seconds
          setTimeout(() => {
            router.push("/dashboard/youtube");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Failed to connect YouTube account");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Connection failed"
        );
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === "loading" && (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            )}
            {status === "success" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {status === "error" && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>YouTube Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="text-center">
              <p className="text-gray-600">
                Connecting your YouTube account...
              </p>
            </div>
          )}

          {status === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-3">
            {status === "success" && (
              <Button
                onClick={() => router.push("/dashboard/youtube")}
                className="bg-green-600 hover:bg-green-700"
              >
                Go to YouTube Settings
              </Button>
            )}

            {status === "error" && (
              <Button
                onClick={() => router.push("/dashboard/youtube")}
                variant="outline"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
