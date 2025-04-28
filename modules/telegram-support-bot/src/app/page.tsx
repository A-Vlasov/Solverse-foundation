import { Chat } from './components/chat';

export default function Home() {
  return (
    <main className="flex flex-col h-screen w-screen p-0">
      <div className="flex flex-col h-full w-full">
        <Chat />
      </div>
    </main>
  );
}
