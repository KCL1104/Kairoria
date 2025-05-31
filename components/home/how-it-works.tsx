import { Step1, Step2, Step3, Step4 } from "@/components/home/step-icons"

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">How Kairoria Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <Step1 />
            </div>
            <h3 className="text-xl font-semibold mb-2">Search & Discover</h3>
            <p className="text-muted-foreground">
              Browse our marketplace to find the perfect items near you, 
              with detailed descriptions and availability calendars.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <Step2 />
            </div>
            <h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
            <p className="text-muted-foreground">
              Reserve items for the timeframe you need, and complete
              secure payment through our platform.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <Step3 />
            </div>
            <h3 className="text-xl font-semibold mb-2">Pick Up & Use</h3>
            <p className="text-muted-foreground">
              Coordinate with the owner to pick up your item,
              verify its condition, and enjoy it for the duration.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <Step4 />
            </div>
            <h3 className="text-xl font-semibold mb-2">Return & Review</h3>
            <p className="text-muted-foreground">
              Return the item in good condition, and leave a review
              to help build trust in our community.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}