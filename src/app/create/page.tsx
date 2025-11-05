import { Suspense } from 'react';
import CreatePageContent from './CreatePageContent';

// A simple loading component to show while the main content is loading.
function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-950">
      <p className="text-white text-lg">Loading Challenge Creator...</p>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreatePageContent />
    </Suspense>
  );
}