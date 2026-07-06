export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-slate">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
        <p>We collect only the information needed to provide and improve the HomeServe experience.</p>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">1. Information we collect</h2>
          <p>Phone number (for OTP login), name, email, saved addresses and their precise location, booking history, and payment records processed via Razorpay.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">2. Location data</h2>
          <p>We request access to your device location only to auto-fill your service address and to show live tracking of your assigned professional during an active booking. You can decline location access and enter your address manually.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">3. How we use your data</h2>
          <p>To match you with available professionals, process payments, send booking and chat notifications, and provide customer support.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">4. Data sharing</h2>
          <p>Your name, service address, and phone number are shared only with the professional assigned to your booking, solely to complete the job.</p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">5. Your rights</h2>
          <p>You may request deletion of your saved addresses and account data at any time by contacting Help & Support.</p>
        </section>
      </div>
    </div>
  );
}
