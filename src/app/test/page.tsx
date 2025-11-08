export default function TestPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-robair-black">
          Rob Air Test Page
        </h1>
        <p className="text-lg text-robair-black/70">
          This page confirms the Next.js app is working on Vercel
        </p>
        <div className="bg-robair-green text-white px-4 py-2 rounded">
          ✅ Deployment Successful
        </div>
      </div>
    </div>
  );
}