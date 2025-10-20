
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/cma/Footer";
import { Header } from "@/components/cma/Header";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Zap, Download } from "lucide-react";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="glass-panel p-8">
    <div className="flex items-center gap-4 mb-4">
      {icon}
      <h3 className="text-2xl font-headline text-accent">{title}</h3>
    </div>
    <p className="text-muted-foreground">{description}</p>
  </div>
);


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center h-screen min-h-[700px] overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div 
            className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background"
            style={{
              maskImage: 'radial-gradient(ellipse at center, transparent 0%, black 80%)'
            }}
          />
          <div 
            className="absolute inset-0 mix-blend-color-dodge opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.3), transparent 40%)',
              animation: 'drift-particles 30s infinite linear'
            }}
          />

          <div className="relative z-10 max-w-4xl text-center px-4">
            <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 text-reveal-from-light">
              Cognitive Mindmap Assistant
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 fade-in" style={{ animationDelay: '0.5s' }}>
              Where Thought Maps Itself.
            </p>
            <div className="fade-in" style={{ animationDelay: '1s' }}>
              <Link href="/dashboard">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary-foreground font-semibold text-lg px-8 py-6 rounded-full accent-glow transition-all duration-300 transform hover:scale-105">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Showcase Section */}
        <section className="py-20 md:py-32 container">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<BrainCircuit className="w-8 h-8 text-accent" />}
                title="AI-Powered Generation"
                description="Simply paste text, upload a PDF, or use your voice. CMA's AI analyzes the content and instantly generates a hierarchical mind map, identifying key concepts and their relationships so you can see the bigger picture in seconds."
              />
              <FeatureCard 
                icon={<Zap className="w-8 h-8 text-accent" />}
                title="Instant Summaries"
                description="Don't just see the concepts—understand them. Select any node in your mind map to get instant AI-generated summaries, detailed explanations, and even creative analogies to solidify your understanding of complex topics."
              />
               <FeatureCard 
                icon={<Download className="w-8 h-8 text-accent" />}
                title="Multiple Export Formats"
                description="Take your mind maps anywhere. Export your creations to various formats including PNG for presentations, PDF for documents, JSON for data portability, and CSV for spreadsheet analysis, ensuring compatibility with your workflow."
              />
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
