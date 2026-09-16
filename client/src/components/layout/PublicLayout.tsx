import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useChatStore } from '../../store/ai/chatStore';
import ChatWidget from '../ai/ChatWidget';

export default function PublicLayout() {
  const { isOpen, toggleChat } = useChatStore();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget isOpen={isOpen} onToggle={toggleChat} />
    </div>
  );
}
