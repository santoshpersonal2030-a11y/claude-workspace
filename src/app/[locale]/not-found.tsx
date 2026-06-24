import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
            <div className="text-6xl">🪔</div>
            <p className="mt-6 font-heading text-7xl text-saffron-700">404</p>
            <h1 className="mt-2 font-heading text-3xl text-maroon-800">
              This path isn&apos;t on our map
            </h1>
            <p className="mt-3 max-w-md text-foreground/70">
              The page you&apos;re looking for may have moved or never existed.
              Let&apos;s get you back to something auspicious.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="rounded-full bg-saffron-700 px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800"
              >
                Back to home
              </Link>
              <Link
                href="/poojas"
                className="rounded-full border border-saffron-300 bg-white px-7 py-3 text-base font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
              >
                Browse poojas
              </Link>
            </div>

            <div className="mt-10 text-sm text-foreground/65">
              Or visit the{" "}
              <Link href="/store" className="font-semibold text-saffron-700 hover:text-saffron-800">
                Samagri Store
              </Link>
              ,{" "}
              <Link href="/pandits" className="font-semibold text-saffron-700 hover:text-saffron-800">
                our Pandits
              </Link>
              , or{" "}
              <Link href="/contact" className="font-semibold text-saffron-700 hover:text-saffron-800">
                contact us
              </Link>
              .
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
