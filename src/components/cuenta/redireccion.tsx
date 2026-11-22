"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Redireccion({ a }: { a: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(a);
  }, [a, router]);
  return null;
}