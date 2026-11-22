import { AreaAdmin } from "@/components/admin/area-admin";

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return <AreaAdmin>{children}</AreaAdmin>;
}