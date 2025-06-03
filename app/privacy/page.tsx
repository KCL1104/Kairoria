import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      
              <div className="prose prose-sm md:prose-base max-w-none">
        <p className="text-muted-foreground mb-8">
          Last Updated: May 12, 2025
        </p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Kairoria ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and services (collectively, the "Service").
          </p>
          <p>
            We value your trust and are committed to ensuring that your personal information remains secure and confidential. Please read this privacy policy carefully to understand our practices regarding your personal data.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Personal Information</h3>
          <p>
            We may collect personally identifiable information, such as:
          </p>
          <ul>
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Postal address</li>
            <li>Payment information (stored securely through third-party payment processors)</li>
            <li>Government-issued ID (for verification purposes)</li>
            <li>Profile picture</li>
            <li>Date of birth</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Non-Personal Information</h3>
          <p>
            We may also collect non-personal information, such as:
          </p>
          <ul>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>IP address</li>
            <li>Device information</li>
            <li>Usage data and browsing patterns</li>
            <li>Approximate location based on IP address</li>
          </ul>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>
            We use the information we collect for various purposes, including:
          </p>
          <ul>
            <li>Providing, operating, and maintaining our Service</li>
            <li>Facilitating transactions between users</li>
            <li>Improving and personalizing the user experience</li>
            <li>Understanding and analyzing usage patterns</li>
            <li>Communicating with you about your account or transactions</li>
            <li>Sending you marketing communications (with your consent)</li>
            <li>Ensuring the security and integrity of our platform</li>
            <li>Detecting and preventing fraud, unauthorized access, and other harmful activities</li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">4. Sharing Your Information</h2>
          <p>
            We may share your personal information with:
          </p>
          <ul>
            <li>Other users as necessary to facilitate rentals (e.g., sharing contact information and location for item pickup)</li>
            <li>Service providers who perform services on our behalf (e.g., payment processing, customer service)</li>
            <li>Legal authorities when required by law or to protect our rights, privacy, safety, or property</li>
            <li>Business partners for joint marketing efforts or business operations (with your consent)</li>
            <li>Potential buyers in the event of a merger, acquisition, or sale of assets</li>
          </ul>
          <p>
            We will never sell your personal information to third parties for their marketing purposes without your explicit consent.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, accidental loss, destruction, or damage.
          </p>
          <p>
            While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security. Any transmission of personal information is at your own risk.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
          </p>
          <p>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
          <p>
            For more information about cookies, please visit our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul>
            <li>The right to access and receive a copy of your personal information</li>
            <li>The right to rectify or update your personal information</li>
            <li>The right to delete your personal information</li>
            <li>The right to restrict or object to our processing of your personal information</li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent at any time for processing based on consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p>
            Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <p>
            <Link href="/contact" className="text-primary hover:underline">
              Contact Page
            </Link>
          </p>
          <p>
            Email: privacy@kairoria.com
          </p>
        </section>
      </div>
    </div>
  )
}