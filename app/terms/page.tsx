import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      
              <div className="prose prose-sm md:prose-base max-w-none">
        <p className="text-muted-foreground mb-8">
          Last Updated: May 12, 2025
        </p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to Kairoria ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Kairoria website, mobile application, and services (collectively, the "Service").
          </p>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            Kairoria is a platform that enables users to lease, loan, and share products. Our mission is to promote sustainable consumption by extending the lifecycle and utility of products.
          </p>
          <p>
            Users may list items for rent ("Owners") or rent items from others ("Renters"). Kairoria facilitates these transactions but is not a party to any agreement between Owners and Renters.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p>
            To use certain features of the Service, you must register for an account. You must provide accurate, current, and complete information during the registration process.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>
          <p>
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">4. User Conduct and Restrictions</h2>
          <p>
            You agree not to use the Service:
          </p>
          <ul>
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
            <li>To impersonate or attempt to impersonate Kairoria, a Kairoria employee, another user, or any other person or entity.</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm Kairoria or users of the Service.</li>
            <li>To list prohibited items, including but not limited to illegal items, dangerous substances, weapons, etc.</li>
          </ul>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">5. Listing and Rental Policies</h2>
          <h3 className="text-xl font-medium mt-6 mb-3">For Owners:</h3>
          <ul>
            <li>You must provide accurate descriptions and images of your items.</li>
            <li>You must ensure your items are in good working condition and safe to use.</li>
            <li>You are responsible for setting your rental rates and availability.</li>
            <li>You must honor confirmed bookings unless there are extenuating circumstances.</li>
            <li>You must disclose any defects or issues with your items before rental.</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">For Renters:</h3>
          <ul>
            <li>You must treat rented items with care and return them in the condition they were received.</li>
            <li>You are responsible for any damage beyond normal wear and tear.</li>
            <li>You must return items on time or extend the rental period with the Owner's approval.</li>
            <li>You may be required to provide a security deposit for certain items.</li>
          </ul>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">6. Fees and Payments</h2>
          <p>
            Kairoria charges a service fee for facilitating transactions between Owners and Renters. The fee structure is described in our Fee Policy, which may be updated from time to time.
          </p>
          <p>
            Payment processing is handled by secure third-party payment processors. By using the Service, you agree to the terms and privacy policies of these payment processors.
          </p>
          <p>
            All fees are non-refundable except as expressly stated in our Cancellation Policy.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">7. Cancellation Policy</h2>
          <p>
            Cancellation policies vary depending on the timing of the cancellation and the specific item. These policies will be clearly displayed before booking confirmation.
          </p>
          <p>
            Owners and Renters may be subject to cancellation fees if they cancel confirmed bookings.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">8. Dispute Resolution</h2>
          <p>
            If a dispute arises between users, we encourage users to communicate directly to resolve the issue. If this is unsuccessful, Kairoria provides a dispute resolution process.
          </p>
          <p>
            Kairoria reserves the right to make the final decision on disputes, including issues related to damages, returns, and refunds.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Kairoria and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
          <p>
            Your continued use of the Service after we post changes to the Terms constitutes your acceptance of those changes.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Page
            </Link>
          </p>
          <p>
            Email: legal@kairoria.com
          </p>
        </section>
      </div>
    </div>
  )
}