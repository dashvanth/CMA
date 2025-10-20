
import { Header } from "@/components/cma/Header";
import { Footer } from "@/components/cma/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="container max-w-4xl py-12">
          <div className="glass-panel p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl font-headline mb-8">Our Mission</h1>
            <div className="space-y-8 text-lg text-muted-foreground text-left max-w-3xl mx-auto">
                <p>
                Modern learners face information overload. Students, professionals, and exam aspirants are buried in text, especially in high-stress &apos;One Day Before Exam&apos; scenarios. Traditional study is static and inefficient.
                </p>
                <p>
                CMA is a cognitive assistant. It uses generative AI to dissect complex topics into interactive, visual mind maps. We turn information into knowledge, instantly. Our platform is designed for focus, clarity, and true comprehension, not just memorization.
                </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
