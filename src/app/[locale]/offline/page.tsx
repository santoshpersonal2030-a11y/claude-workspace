import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = { title: "Offline — BookMyPoojari" };

// Shown by the service worker when a navigation fails with no network.
export default function OfflinePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <div className="text-5xl">🪔</div>
          <h1 className="mt-4 font-heading text-2xl text-maroon-800">
            You&apos;re offline
          </h1>
          <p className="mt-2 text-foreground/65">
            We couldn&apos;t reach BookMyPoojari. Check your connection and try
            again — your cart and saved details are safe.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
