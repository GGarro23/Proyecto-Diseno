"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Lleva a otra página apenas se muestra
export function Redirigir({ a }: { a: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(a);
  }, [a, router]);
  return null;
}