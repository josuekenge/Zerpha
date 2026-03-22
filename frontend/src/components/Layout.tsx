import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden text-base antialiased selection:bg-indigo-400/20 selection:text-indigo-300 bg-[#09090b] text-white font-sans">
      {children}
    </div>
  );
}
