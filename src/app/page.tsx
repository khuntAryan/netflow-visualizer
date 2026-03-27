import Sidebar from '@/components/Sidebar';
import NetworkCanvas from '@/components/NetworkCanvas';

export default function Home() {
  return (
    <main className="flex h-screen w-full overflow-hidden bg-black flex-col md:flex-row">
      <Sidebar />
      <NetworkCanvas />
    </main>
  );
}
