import { AreaAdmin } from "@/components/admin/area-admin";

// Todas las pantallas dentro de /admin comparten la barra lateral y el control de acceso
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return <AreaAdmin>{children}</AreaAdmin>;
}