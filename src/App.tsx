import { useCallback, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { LiveChatSection } from './components/LiveChatSection';
import { PatientQueueSection } from './components/PatientQueueSection';
import { ApproachSection } from './components/ApproachSection';
import { FaithMomentSection } from './components/FaithMomentSection';
import { AboutSection } from './components/AboutSection';
import { FaqSection } from './components/FaqSection';
import { BookingSection } from './components/BookingSection';
import { Footer } from './components/Footer';
import type { PatientRecord } from './data/patientsStore';

export function App() {
  const [activeChat, setActiveChat] = useState<{
    patient: PatientRecord;
    token: string;
  } | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [focusTrigger, setFocusTrigger] = useState(0);

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBooking = (topic = '') => {
    if (topic) {
      setSelectedTopic(topic);
    }
    scrollToSection('agendamento');
    setFocusTrigger((prev) => prev + 1);
  };

  const handleChatUpdated = useCallback((updatedPatient: PatientRecord) => {
    setActiveChat((prev) =>
      prev && prev.patient.id === updatedPatient.id
        ? { ...prev, patient: updatedPatient }
        : prev
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F6] text-[#1C1F1D]">
      <Navbar onBookClick={() => scrollToBooking()} />

      <main className="flex-1">
        <HeroSection onChatClick={() => scrollToSection('conversar-agora')} />
        <LiveChatSection
          activeChat={activeChat}
          onChatStarted={(session) => {
            setActiveChat(session);
            setRefreshSignal((prev) => prev + 1);
          }}
          onChatUpdated={handleChatUpdated}
          onClearChat={() => setActiveChat(null)}
          onOpenQueue={() => scrollToSection('pacientes')}
        />
        <PatientQueueSection refreshSignal={refreshSignal} />
        <ApproachSection onSelectTopic={(topic) => scrollToBooking(topic)} />
        <FaithMomentSection
          onBookClick={() =>
            scrollToBooking('Acolhimento emocional e propósito de vida')
          }
        />
        <AboutSection />
        <FaqSection />
        <BookingSection
          selectedTopic={selectedTopic}
          focusTrigger={focusTrigger}
          onBookingCreated={() => setRefreshSignal((prev) => prev + 1)}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;
