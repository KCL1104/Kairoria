import { Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TestimonialProps {
  quote: string
  name: string
  title: string
  avatarSrc: string
}

function Testimonial({ quote, name, title, avatarSrc }: TestimonialProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <Quote className="h-8 w-8 text-primary/30 mb-4" />
        <p className="text-muted-foreground mb-6 italic">{quote}</p>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Testimonial
            quote="Kairoria has completely changed how I think about ownership. I've saved thousands by renting power tools instead of buying them for one-time projects."
            name="Michael Rodriguez"
            title="DIY Enthusiast"
            avatarSrc="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300"
          />
          <Testimonial
            quote="As a photographer, I can now try expensive equipment before investing. The platform is intuitive and the community is respectful of the gear."
            name="Sarah Johnson"
            title="Professional Photographer"
            avatarSrc="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300"
          />
          <Testimonial
            quote="I'm earning passive income from items that were collecting dust in my garage. The process is seamless and the support team is incredibly helpful."
            name="David Chen"
            title="Product Owner"
            avatarSrc="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300"
          />
        </div>
      </div>
    </section>
  )
}