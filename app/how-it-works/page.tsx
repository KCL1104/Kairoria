import Link from "next/link"
import { ArrowRight, Award, BadgeCheck, CheckCircle, Globe, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Step1, Step2, Step3, Step4 } from "@/components/home/step-icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How Kairoria Works</h1>
          <p className="text-xl text-muted-foreground">
            Join our community-powered marketplace where you can rent, lease, and share products.
            It's simple, sustainable, and social.
          </p>
        </div>
      </section>
      
      {/* Main Process Section */}
      <section className="py-16 md:py-24 container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">The Kairoria Process</h2>
          
          {/* Step 1 */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-8 items-center mb-16">
            <div className="flex justify-center md:justify-start">
              <Step1 />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">1. Search & Discover</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Browse thousands of high-quality items available in your area. Use our advanced filters to find exactly what you need, when you need it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Detailed listings with high-quality photos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Location-based search with map view</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Verified users with ratings and reviews</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          <Separator className="my-16" />
          
          {/* Step 2 */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8 items-center mb-16">
            <div>
              <h3 className="text-2xl font-semibold mb-4">2. Book & Pay</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Request to rent items for your desired timeframe and communicate with owners through our secure messaging system. Complete payment through our trusted payment platform.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Flexible rental periods</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Secure payment processing</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Clear pricing with no hidden fees</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Step2 />
            </div>
          </div>
          
          <Separator className="my-16" />
          
          {/* Step 3 */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-8 items-center mb-16">
            <div className="flex justify-center md:justify-start">
              <Step3 />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">3. Pick Up & Use</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Meet with the owner to pick up the item. Both parties verify the condition and complete a handover checklist. Enjoy using the item for your rental period.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Coordinated pickup locations</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Condition verification process</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Usage guidelines and support</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          <Separator className="my-16" />
          
          {/* Step 4 */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8 items-center mb-16">
            <div>
              <h3 className="text-2xl font-semibold mb-4">4. Return & Review</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Return the item on time in the same condition you received it. Complete the return checklist with the owner, then leave a review about your experience.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Flexible return options</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Return condition verification</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <p>Two-way review system</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Step4 />
            </div>
          </div>
        </div>
      </section>
      
      {/* For Renters vs. Owners Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-16">Kairoria for Everyone</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* For Renters */}
            <div>
              <div className="bg-primary/10 p-4 rounded-full w-max mx-auto mb-6">
                <HelpCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-center mb-6">For Renters</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Save money by renting instead of buying items you'll use infrequently</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Try before you buy expensive equipment</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Reduce clutter in your home by renting only when needed</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Access high-quality items that might be otherwise unaffordable</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Minimize your environmental footprint by sharing resources</span>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <Link href="/marketplace">
                  <Button>
                    Start Renting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* For Owners */}
            <div>
              <div className="bg-primary/10 p-4 rounded-full w-max mx-auto mb-6">
                <HelpCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-center mb-6">For Owners</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Earn passive income from items you already own</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Offset the cost of expensive purchases by renting them out</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Help others access items they need without buying new</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Build your reputation through positive reviews</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0" />
                  <span>Contribute to reducing waste and overconsumption</span>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <Link href="/profile/listings/new">
                  <Button>
                    List Your Items
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg">How does insurance work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Kairoria offers optional insurance coverage for both owners and renters. For a small fee, owners can protect their items against damage beyond normal wear and tear. Renters can also purchase coverage to reduce their liability. Each listing will indicate what insurance options are available.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg">What if an item is damaged during rental?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If an item is damaged during rental, the renter is responsible for repair or replacement costs, unless they purchased insurance coverage. We encourage owners and renters to document the condition of items at pickup and return to avoid disputes. Our support team can help mediate if needed.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg">How are payments handled?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All payments are processed securely through our platform. When a rental is booked, the payment is held until 24 hours after the rental period begins. This gives renters time to verify the item's condition. Owners receive their payout minus the service fee after this period.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg">What items can I list on Kairoria?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can list most physical items in good working condition. Popular categories include electronics, tools, outdoor gear, home goods, and vehicles. We prohibit listing weapons, illegal items, perishables, and certain personal items. Check our full guidelines for detailed restrictions.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg">How does verification work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Users can verify their accounts by confirming their email, phone number, connecting social media accounts, and uploading government-issued ID. Verified users build trust and often receive more rental requests. For high-value items, additional verification steps may be required.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg">What fees does Kairoria charge?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Kairoria charges a 10% service fee to owners calculated from the total rental price. Renters pay a 5% service fee plus a small insurance fee if they opt for coverage. These fees cover platform maintenance, customer support, payment processing, and marketing efforts.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're here to help.
            </p>
            <Link href="/contact">
              <Button variant="outline">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Trust & Safety Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Trust & Safety</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BadgeCheck className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Verified Users</h3>
                  <p className="text-muted-foreground">
                    Our multi-step verification process ensures you're dealing with real, trustworthy individuals.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Globe className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
                  <p className="text-muted-foreground">
                    All communication and payments happen within our secure, encrypted platform.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Reviews & Ratings</h3>
                  <p className="text-muted-foreground">
                    Our two-way review system builds accountability and helps users make informed decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Support Team</h3>
                  <p className="text-muted-foreground">
                    Our dedicated support team is ready to help resolve any issues that may arise.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users already sharing and renting items on Kairoria.
            It's free to sign up and start browsing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Marketplace
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Create an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}