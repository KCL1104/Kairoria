import Image from "next/image"
import Link from "next/link"
import { Leaf, RefreshCw, Users, Award, BadgeCheck, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Mission</h1>
          <p className="text-xl text-muted-foreground mb-8">
            We're building a community-driven marketplace to transform how we consume products,
            moving from ownership to access, one rental at a time.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Reimagining Consumption</h2>
              <p className="text-lg text-muted-foreground mb-6">
                At Kairoria, we believe that access is more important than ownership. Our platform enables people to share high-quality products, reducing waste while creating economic opportunities.
              </p>
              <p className="text-lg text-muted-foreground">
                By extending the lifecycle of products and maximizing their utility, we're building a more sustainable future together with our community.
              </p>
              <div className="mt-8 flex gap-4">
                <Link href="/marketplace">
                  <Button>Explore Marketplace</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline">Join Us</Button>
                </Link>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden aspect-square">
              <img
                src="https://images.pexels.com/photos/3184430/pexels-photo-3184430.jpeg" 
                alt="Team discussing sustainability"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-16">Our Core Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Leaf className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Sustainability</h3>
              <p className="text-muted-foreground">
                We prioritize ecological impact in everything we do, from our platform operations to the products we allow on our marketplace.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community</h3>
              <p className="text-muted-foreground">
                We foster connections between people who share values of resource conservation, cooperation, and mutual respect.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Circular Economy</h3>
              <p className="text-muted-foreground">
                We believe in maximizing the value of resources by keeping products in use for as long as possible and regenerating natural systems.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-10">Our Story</h2>
          
          <div className="space-y-6">
            <p>
              Kairoria was born out of a simple observation: most of us own products that spend the majority of their lives unused, while simultaneously, others are purchasing these same items for limited use.
            </p>
            <p>
              Our founder, after buying an expensive power tool for a single weekend project, realized there must be a better way. What if we could access the things we need without the burden of ownership? What if we could make better use of the resources we already have?
            </p>
            <p>
              In 2023, we launched with a small community in San Francisco, connecting neighbors who needed tools, cameras, and outdoor gear. The response was overwhelming - people weren't just saving money and space, they were building community connections and reducing their environmental footprint.
            </p>
            <p>
              Today, Kairoria has grown into a nationwide marketplace with thousands of products available for rent. But our mission remains the same: to transform consumption by enabling people to access rather than own, to share rather than waste, and to connect rather than consume in isolation.
            </p>
          </div>
          
          <Separator className="my-12" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">25,000+</p>
              <p className="text-muted-foreground mt-2">Active users</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">12,000+</p>
              <p className="text-muted-foreground mt-2">Items shared</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">85 tons</p>
              <p className="text-muted-foreground mt-2">CO₂ emissions saved</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-16">Meet Our Team</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                <img 
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"
                  alt="James Taylor"
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="font-semibold text-lg">James Taylor</h3>
              <p className="text-primary text-sm">Founder & CEO</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                <img 
                  src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"
                  alt="Sarah Johnson"
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="font-semibold text-lg">Sarah Johnson</h3>
              <p className="text-primary text-sm">Head of Product</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                <img 
                  src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
                  alt="Michael Rodriguez"
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="font-semibold text-lg">Michael Rodriguez</h3>
              <p className="text-primary text-sm">Lead Developer</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                <img 
                  src="https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg"
                  alt="Emily Wilson"
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="font-semibold text-lg">Emily Wilson</h3>
              <p className="text-primary text-sm">Community Lead</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Partners Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-6">Our Partners & Supporters</h2>
          <p className="text-center text-muted-foreground mb-12">
            We're proud to work with organizations that share our commitment to sustainability.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center justify-center h-16 p-4">
              <div className="text-2xl font-semibold text-muted-foreground">EcoAlliance</div>
            </div>
            <div className="flex items-center justify-center h-16 p-4">
              <div className="text-2xl font-semibold text-muted-foreground">CircularTech</div>
            </div>
            <div className="flex items-center justify-center h-16 p-4">
              <div className="text-2xl font-semibold text-muted-foreground">GreenFund</div>
            </div>
            <div className="flex items-center justify-center h-16 p-4">
              <div className="text-2xl font-semibold text-muted-foreground">SustainVC</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-lg mb-8">
            Be part of the movement to transform consumption and build a more sustainable future.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Explore Marketplace
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="border-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}