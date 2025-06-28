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