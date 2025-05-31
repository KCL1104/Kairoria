import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <img src="/logo.png" alt="Kairoria" className="h-6 w-6" />
              <span>Kairoria</span>
            </Link>
            <p className="text-muted-foreground text-sm mt-2">
              Sustainable consumption through product leasing and loans.
              Reducing waste, one rental at a time.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-3">Marketplace</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary">All Products</Link></li>
              <li><Link href="/?category=electronics" className="text-sm text-muted-foreground hover:text-primary">Electronics</Link></li>
              <li><Link href="/?category=tools" className="text-sm text-muted-foreground hover:text-primary">Tools</Link></li>
              <li><Link href="/?category=outdoor" className="text-sm text-muted-foreground hover:text-primary">Outdoor Gear</Link></li>
              <li><Link href="/?category=home" className="text-sm text-muted-foreground hover:text-primary">Home Goods</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-sm mb-3">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/profile" className="text-sm text-muted-foreground hover:text-primary">My Profile</Link></li>
              <li><Link href="/profile?tab=listings" className="text-sm text-muted-foreground hover:text-primary">My Listings</Link></li>
              <li><Link href="/profile?tab=rentals" className="text-sm text-muted-foreground hover:text-primary">My Rentals</Link></li>
              <li><Link href="/messages" className="text-sm text-muted-foreground hover:text-primary">Messages</Link></li>
              <li><Link href="/profile?tab=settings" className="text-sm text-muted-foreground hover:text-primary">Settings</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-sm mb-3">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-primary">How It Works</Link></li>
              <li><Link href="/sustainability" className="text-sm text-muted-foreground hover:text-primary">Sustainability</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between mt-10 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kairoria. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms</Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}