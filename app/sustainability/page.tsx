import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sustainability | Kairoria',
  description: 'Learn about Kairoria\'s commitment to sustainability and reducing environmental impact through product sharing.',
}

export default function SustainabilityPage() {
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Commitment to Sustainability</h1>
          <p className="text-xl text-muted-foreground">
            Reducing waste and environmental impact through the sharing economy
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Mission Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Our Mission</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg mb-4">
                At Kairoria, we believe that sustainability starts with changing how we consume. 
                By creating a platform where people can rent and share products instead of buying new ones, 
                we're helping to reduce waste and minimize environmental impact.
              </p>
              <p className="text-lg">
                Every rental transaction on our platform prevents the production of a new item, 
                reducing resource consumption and keeping existing products in circulation longer.
              </p>
            </div>
          </section>

          {/* Impact Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Environmental Impact</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Waste Reduction</h3>
                <p>
                  By enabling product sharing, we help extend the lifecycle of existing items, 
                  reducing the need for new production and preventing premature disposal.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Resource Conservation</h3>
                <p>
                  Sharing products means fewer raw materials are needed for manufacturing, 
                  conserving natural resources and reducing energy consumption.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Carbon Footprint</h3>
                <p>
                  Reduced manufacturing demand leads to lower carbon emissions from production, 
                  transportation, and packaging of new products.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Community Building</h3>
                <p>
                  Local sharing reduces transportation needs and builds stronger, 
                  more sustainable communities through resource sharing.
                </p>
              </div>
            </div>
          </section>

          {/* Principles Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Sustainability Principles</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-lg font-medium mb-2">Share Over Buy</h3>
                <p>
                  We encourage users to consider renting before purchasing, 
                  especially for items used infrequently.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-lg font-medium mb-2">Quality Over Quantity</h3>
                <p>
                  We promote high-quality, durable products that can be shared 
                  multiple times across our community.
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-medium mb-2">Local First</h3>
                <p>
                  We prioritize local sharing to reduce transportation emissions 
                  and support local communities.
                </p>
              </div>
            </div>
          </section>

          {/* Future Goals */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Future Goals</h2>
            <div className="bg-muted/50 rounded-lg p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Track and display environmental impact metrics for each rental</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Partner with local repair shops to extend product lifecycles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Implement carbon-neutral delivery options</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Develop recycling programs for end-of-life products</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center bg-primary/5 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Join Our Sustainability Mission</h2>
            <p className="text-lg mb-6">
              Every rental makes a difference. Start sharing today and be part of the solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/marketplace" 
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Rentals
              </a>
              <a 
                href="/profile/listings/new" 
                className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary/10 transition-colors"
              >
                List an Item
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 