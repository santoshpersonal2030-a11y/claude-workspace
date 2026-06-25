import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Shared chrome for simple content pages (legal, about, how-it-works).
export default function ContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <h1 className="font-heading text-4xl text-maroon-800">{title}</h1>
            {intro && (
              <p className="mt-3 text-lg text-foreground/70">{intro}</p>
            )}
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {children}
        </section>
      </main>
      <Footer />
    </>
  );
}
