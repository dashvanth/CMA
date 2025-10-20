
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/cma/Header";
import { Footer } from "@/components/cma/Footer";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 pt-24">
            <div className="w-full max-w-2xl mx-auto">
                <div className="glass-panel p-8 md:p-12">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-headline">Get in Touch</h1>
                        <p className="text-muted-foreground mt-2">We&apos;d love to hear from you. Drop us a line below!</p>
                    </div>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" type="text" placeholder="Your Name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="you@example.com" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" placeholder="Your message..." required className="min-h-32" />
                        </div>
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-lg py-6">
                            Submit Message
                        </Button>
                    </form>
                </div>
            </div>
        </main>
        <Footer />
    </div>
  );
}
