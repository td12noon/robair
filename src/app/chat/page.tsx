import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles, MessageCircle, Lightbulb, Key } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";

export default function ChatPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-robair-green">
            <Bot className="h-6 w-6 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-robair-black">AI Assistant</h1>
            <p className="text-robair-black/70">
              Ask questions about your aircraft and get instant, intelligent answers
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface />

      {/* Example Questions */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Example Questions
            </CardTitle>
            <CardDescription>
              Here are some examples of what you can ask the AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-robair-black">Maintenance Questions</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "When was the last oil change?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "What maintenance is due this month?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "Show me propeller maintenance history"
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-robair-black">Flight Questions</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "How many flights to LAX this year?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "What's my total flight time?"
                  </div>
                  <div className="p-2 bg-robair-light rounded cursor-pointer hover:bg-robair-light/80">
                    "Where did I fly last weekend?"
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle>Smart Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Get intelligent analysis of your flight patterns, maintenance trends, and aircraft performance.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle>Natural Language</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Ask questions in plain English and get clear, helpful answers about your aircraft data.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Bot className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle>24/7 Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Your AI assistant is always ready to help with aircraft information and aviation questions.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Setup Notice */}
      <Card className="border-dashed bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <Key className="mr-2 h-5 w-5" />
            OpenAI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-amber-700">
              To unlock the full potential of your AI assistant, add your OpenAI API key:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
              <li>Get an API key from <code className="text-xs bg-amber-100 px-1 rounded">platform.openai.com</code></li>
              <li>Add <code className="text-xs bg-amber-100 px-1 rounded">OPENAI_API_KEY=your_key_here</code> to Vercel environment variables</li>
              <li>Redeploy the application to enable AI chat</li>
            </ol>
            <p className="text-xs text-amber-600">
              Without the API key, the assistant will still work but with limited functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}