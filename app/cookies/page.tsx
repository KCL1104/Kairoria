import Link from "next/link"

export default function CookiesPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>
      
              <div className="prose prose-sm md:prose-base max-w-none">
        <p className="text-muted-foreground mb-8">
          Last Updated: May 12, 2025
        </p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how their site is used.
          </p>
          <p>
            Cookies set by Kairoria are called "first-party cookies." Cookies set by parties other than Kairoria are called "third-party cookies." Third-party cookies enable features or functionality provided by third parties to be incorporated into our website, such as analytics, advertising, and interactive content.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You may disable these by changing your browser settings, but this may affect how the website functions.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Performance and Analytics Cookies</h3>
          <p>
            These cookies help us to understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and enhance user experience.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Functionality Cookies</h3>
          <p>
            These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Targeting/Advertising Cookies</h3>
          <p>
            These cookies are used to track visitors across websites. They are set to display targeted advertisements based on your interests and online behavior.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. Specific Cookies We Use</h2>
          
          <div className="mt-4 border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Purpose</th>
                  <th className="p-3 text-left">Duration</th>
                  <th className="p-3 text-left">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3">_kairoria_session</td>
                  <td className="p-3">Maintains user session</td>
                  <td className="p-3">Session</td>
                  <td className="p-3">Essential</td>
                </tr>
                <tr>
                  <td className="p-3">_kairoria_auth</td>
                  <td className="p-3">Authentication token</td>
                  <td className="p-3">30 days</td>
                  <td className="p-3">Essential</td>
                </tr>
                <tr>
                  <td className="p-3">_ga</td>
                  <td className="p-3">Google Analytics tracking</td>
                  <td className="p-3">2 years</td>
                  <td className="p-3">Analytics</td>
                </tr>
                <tr>
                  <td className="p-3">_gid</td>
                  <td className="p-3">Google Analytics user identification</td>
                  <td className="p-3">24 hours</td>
                  <td className="p-3">Analytics</td>
                </tr>
                <tr>
                  <td className="p-3">_kairoria_preferences</td>
                  <td className="p-3">Stores user preferences like theme</td>
                  <td className="p-3">1 year</td>
                  <td className="p-3">Functionality</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
          <p>
            Most web browsers allow you to manage your cookie preferences. You can:
          </p>
          <ul>
            <li>Delete cookies from your device</li>
            <li>Block cookies by activating the setting on your browser that allows you to refuse all or some cookies</li>
            <li>Set your browser to notify you when you receive a cookie</li>
          </ul>
          <p>
            Please note that if you choose to block or delete cookies, you may not be able to access certain areas or features of our website, and some services may not function properly.
          </p>
          <p>
            To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.allaboutcookies.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">5. Your Choices</h2>
          <p>
            When you first visit our website, you will be presented with a cookie banner that allows you to accept or decline non-essential cookies. You can change your preferences at any time by clicking the "Cookie Preferences" link in the footer of our website.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">6. Changes to This Cookie Policy</h2>
          <p>
            We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last Updated" date.
          </p>
          <p>
            You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p>
            If you have any questions about this Cookie Policy, please contact us:
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