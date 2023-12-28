import Navbar from "@/components/organism/Navbar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Navbar />
      <div>{children}</div>
    </main>
  );
}
