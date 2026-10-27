import dynamicImport from "next/dynamic";
export const dynamic = "force-dynamic";
const ClientShell = dynamicImport(()=>import("@/components/ClientShell"), { ssr: false });
export default function Page(){ return <ClientShell />; }
