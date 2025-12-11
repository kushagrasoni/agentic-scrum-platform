"use client";

import { useState, useEffect } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {!isFullscreen && <Header />}
      {!isFullscreen && <Sidebar />}
      <main className={isFullscreen ? "p-0" : "ml-64 mt-16 p-8"}>
        <div className={isFullscreen ? "" : "max-w-7xl mx-auto"}>
          {children}
        </div>
      </main>
    </div>
  );
}
