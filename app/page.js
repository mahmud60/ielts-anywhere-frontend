import LandingPage from "@/components/landing/LandingPage";

export const metadata = {
  title: "IELTSAnywhere — Practice IELTS Online with AI Band Scores",
  description:
    "Realistic IELTS practice for Listening, Reading, Writing and Speaking — with instant AI band scores, detailed feedback, and progress tracking. Start preparing for your target band today.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <LandingPage />;
}
