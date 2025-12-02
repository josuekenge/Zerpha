import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden text-base antialiased selection:bg-indigo-100 selection:text-indigo-700 bg-white text-slate-900 font-sans">
      {children}
    </div>
  );
}
