export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-slate">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
      <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
        <p>By booking a service through HomeServe, you agree to the following terms.</p>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">1. Bookings</h2>
          <p>Bookings are confirmed once a payment method is selected and, where applicable, payment is completed. Professionals are dispatched based on availability and proximity to your service address.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">2. Cancellations</h2>
          <p>Bookings can be cancelled free of charge before a professional accepts the request. Cancellation charges may apply after a professional has been assigned.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">3. Payments</h2>
          <p>Payments are processed securely via Razorpay, your saved wallet balance, or cash on completion. All prices are inclusive of applicable taxes unless stated otherwise.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">4. Professional conduct</h2>
          <p>All professionals listed on HomeServe undergo identity verification before onboarding. Report any conduct concerns through Help & Support.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">5. Liability</h2>
          <p>HomeServe facilitates connections between customers and independent service professionals and is not liable for the quality of workmanship beyond the guarantees explicitly stated in our service policy.</p>
        </section>
      </div>
    </div>
  );
}
