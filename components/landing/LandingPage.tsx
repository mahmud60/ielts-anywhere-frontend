import { BookText, Headphones, MicIcon, Pen } from "lucide-react";

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SectionCard from "@/components/landing/SectionCard";

const sections = [
  {
    title: "Listening",
    description:
      "Practice with authentic audio recordings and answer different question types just like in the real IELTS exam.",
    icon: <Headphones className="h-6 w-6 text-white" />,
    color: "bg-blue-500",
    delay: 100,
  },
  {
    title: "Reading",
    description:
      "Improve your comprehension skills with diverse passages and practice different question formats.",
    icon: <BookText className="h-6 w-6 text-white" />,
    color: "bg-green-500",
    delay: 200,
  },
  {
    title: "Writing",
    description:
      "Develop your writing skills for both Task 1 and Task 2 with guided practice and detailed feedback.",
    icon: <Pen className="h-6 w-6 text-white" />,
    color: "bg-purple-500",
    delay: 300,
  },
  {
    title: "Speaking",
    description:
      "Practice your speaking skills with an AI interviewer that simulates the real IELTS speaking test.",
    icon: <MicIcon className="h-6 w-6 text-white" />,
    color: "bg-orange-500",
    delay: 400,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      <section id="content-section" className="px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">Complete IELTS Preparation</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Practice all four sections of the IELTS test with our comprehensive platform designed to simulate the real
            exam experience.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sections.map((section) => (
              <SectionCard key={section.title} {...section} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/50 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">Why Practice with IELTSAnywhere?</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="glass-card animate-slide-up p-6 opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
              <h3 className="mb-2 text-lg font-semibold">Realistic Experience</h3>
              <p className="text-sm text-muted-foreground">
                Practice with tests that closely mimic the format, timing, and question types of the real IELTS exam.
              </p>
            </div>

            <div className="glass-card animate-slide-up p-6 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
              <h3 className="mb-2 text-lg font-semibold">Instant Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Receive detailed feedback on your performance with suggestions for improvement in each section.
              </p>
            </div>

            <div className="glass-card animate-slide-up p-6 opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
              <h3 className="mb-2 text-lg font-semibold">Anytime, Anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Access your IELTS practice on any device, at any time, allowing you to prepare whenever it suits you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground px-4 py-8 text-white">
        <div className="container mx-auto text-center">
          <p className="text-sm opacity-80">© {new Date().getFullYear()} IELTSAnywhere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
