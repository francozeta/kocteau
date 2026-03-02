import ReactQueryProvider from "../providers/react-query-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}