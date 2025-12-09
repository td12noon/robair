"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bug, 
  Plane, 
  Bot, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  Key,
  Send
} from "lucide-react";

interface DebugResponse {
  debug: boolean;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export default function DebugPage() {
  const [flightAwareResponse, setFlightAwareResponse] = useState<DebugResponse | null>(null);
  const [openAiResponse, setOpenAiResponse] = useState<DebugResponse | null>(null);
  const [flightAwareLoading, setFlightAwareLoading] = useState(false);
  const [openAiLoading, setOpenAiLoading] = useState(false);
  const [testMessage, setTestMessage] = useState("Hello, this is a test message.");
  const [skipCache, setSkipCache] = useState(false);

  const testFlightAware = async () => {
    setFlightAwareLoading(true);
    try {
      const url = `/api/debug/flights${skipCache ? '?skipCache=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setFlightAwareResponse(data);
    } catch (error) {
      setFlightAwareResponse({
        debug: true,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch',
      });
    } finally {
      setFlightAwareLoading(false);
    }
  };

  const testOpenAi = async () => {
    setOpenAiLoading(true);
    try {
      const response = await fetch('/api/debug/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      });
      const data = await response.json();
      setOpenAiResponse(data);
    } catch (error) {
      setOpenAiResponse({
        debug: true,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch',
      });
    } finally {
      setOpenAiLoading(false);
    }
  };

  const StatusBadge = ({ success }: { success?: boolean }) => {
    if (success === undefined) return null;
    return success ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Success
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </span>
    );
  };

  const JsonDisplay = ({ data, title }: { data: any; title: string }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-robair-black/70">{title}</h4>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500">
            <Bug className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-robair-black">API Debug Console</h1>
            <p className="text-robair-black/70">
              Test and inspect raw API requests and responses
            </p>
          </div>
        </div>
      </div>

      {/* FlightAware Debug */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>FlightAware API</CardTitle>
                <CardDescription>Test connection to FlightAware AeroAPI</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={skipCache}
                  onChange={(e) => setSkipCache(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Skip Cache</span>
              </label>
              <Button 
                onClick={testFlightAware} 
                disabled={flightAwareLoading}
                variant="outline"
              >
                {flightAwareLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Test API
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {flightAwareResponse ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap gap-4 p-4 bg-robair-light/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <StatusBadge success={flightAwareResponse.success !== false && !flightAwareResponse.error} />
                </div>
                {flightAwareResponse.responseTimeMs && (
                  <div className="flex items-center space-x-1 text-sm text-robair-black/70">
                    <Clock className="w-4 h-4" />
                    <span>{flightAwareResponse.responseTimeMs}ms</span>
                  </div>
                )}
                {flightAwareResponse.source && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Source: {flightAwareResponse.source}
                  </span>
                )}
                {flightAwareResponse.flightsCount !== undefined && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {flightAwareResponse.flightsCount} flights
                  </span>
                )}
              </div>

              {/* API Key Info */}
              {flightAwareResponse.keyInfo && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">API Key Status</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-amber-700">Configured:</span>{' '}
                      <span className={flightAwareResponse.keyInfo.exists ? 'text-green-600' : 'text-red-600'}>
                        {flightAwareResponse.keyInfo.exists ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-700">Length:</span>{' '}
                      <span>{flightAwareResponse.keyInfo.length}</span>
                    </div>
                    <div>
                      <span className="text-amber-700">Prefix:</span>{' '}
                      <code className="bg-amber-100 px-1 rounded">{flightAwareResponse.keyInfo.prefix}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {flightAwareResponse.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-800 mb-1">Error</div>
                  <div className="text-red-700 text-sm">{flightAwareResponse.error}</div>
                  {flightAwareResponse.stack && (
                    <pre className="mt-2 text-xs text-red-600 overflow-x-auto">{flightAwareResponse.stack}</pre>
                  )}
                </div>
              )}

              {/* Request Info */}
              {flightAwareResponse.request && (
                <JsonDisplay data={flightAwareResponse.request} title="Request" />
              )}

              {/* Response Info */}
              {flightAwareResponse.response && (
                <JsonDisplay data={flightAwareResponse.response} title="Response" />
              )}

              {/* Flights Preview */}
              {flightAwareResponse.flights && flightAwareResponse.flights.length > 0 && (
                <JsonDisplay data={flightAwareResponse.flights} title="Flights (First 5)" />
              )}

              {/* Full Response */}
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-robair-black/70 hover:text-robair-black">
                  View Full Response
                </summary>
                <JsonDisplay data={flightAwareResponse} title="" />
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-robair-black/50">
              Click "Test API" to send a request to FlightAware
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenAI Debug */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>OpenAI API</CardTitle>
                <CardDescription>Test connection to OpenAI GPT-4o-mini</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter a test message..."
              className="flex-1"
            />
            <Button 
              onClick={testOpenAi} 
              disabled={openAiLoading}
              variant="outline"
            >
              {openAiLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test API
            </Button>
          </div>

          {openAiResponse ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap gap-4 p-4 bg-robair-light/50 rounded-lg">
                <StatusBadge success={openAiResponse.success} />
                {openAiResponse.responseTimeMs && (
                  <div className="flex items-center space-x-1 text-sm text-robair-black/70">
                    <Clock className="w-4 h-4" />
                    <span>{openAiResponse.responseTimeMs}ms</span>
                  </div>
                )}
              </div>

              {/* API Key Info */}
              {openAiResponse.keyInfo && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">API Key Status</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-amber-700">Configured:</span>{' '}
                      <span className={openAiResponse.keyInfo.exists ? 'text-green-600' : 'text-red-600'}>
                        {openAiResponse.keyInfo.exists ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-700">Length:</span>{' '}
                      <span>{openAiResponse.keyInfo.length}</span>
                    </div>
                    <div>
                      <span className="text-amber-700">Prefix:</span>{' '}
                      <code className="bg-amber-100 px-1 rounded">{openAiResponse.keyInfo.prefix}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {openAiResponse.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-800 mb-1">Error</div>
                  <div className="text-red-700 text-sm">{openAiResponse.error}</div>
                  {openAiResponse.stack && (
                    <pre className="mt-2 text-xs text-red-600 overflow-x-auto">{openAiResponse.stack}</pre>
                  )}
                </div>
              )}

              {/* Request Info */}
              {openAiResponse.request && (
                <JsonDisplay data={openAiResponse.request} title="Request" />
              )}

              {/* Response Info */}
              {openAiResponse.response && (
                <JsonDisplay data={openAiResponse.response} title="Response" />
              )}

              {/* Full Response */}
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-robair-black/70 hover:text-robair-black">
                  View Full Response
                </summary>
                <JsonDisplay data={openAiResponse} title="" />
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-robair-black/50">
              Click "Test API" to send a test request to OpenAI
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Environment Variables Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-robair-light/50 rounded-lg">
              <code className="font-mono text-xs">FLIGHTAWARE_API_KEY</code>
              <p className="text-robair-black/70 mt-1">Required for flight data</p>
            </div>
            <div className="p-3 bg-robair-light/50 rounded-lg">
              <code className="font-mono text-xs">OPENAI_API_KEY</code>
              <p className="text-robair-black/70 mt-1">Required for AI chatbot</p>
            </div>
            <div className="p-3 bg-robair-light/50 rounded-lg">
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
              <p className="text-robair-black/70 mt-1">Required for caching</p>
            </div>
            <div className="p-3 bg-robair-light/50 rounded-lg">
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              <p className="text-robair-black/70 mt-1">Required for caching</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

