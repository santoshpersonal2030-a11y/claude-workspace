export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gold/40 bg-burgundy-dark text-cream">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
        <p className="text-gold font-semibold">Online Pooja Stores</p>
        <p className="mt-1 text-cream/80">
          Provident Global Services (PGS), Hyderabad, Telangana
        </p>
        <p className="mt-1 text-cream/80">
          Cash on Delivery across India · Free shipping over ₹999
        </p>
        <p className="mt-4 text-xs text-cream/60">
          © {new Date().getFullYear()} Online Pooja Stores. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
