"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, MapPin, Phone, Send, MessageSquare, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // In a real application, this would send the form data to an API
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1500)
  }
  
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-6 text-center">Contact Us</h1>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Have questions about Kairoria? We're here to help. Send us a message and our team will get back to you as soon as possible.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-muted-foreground">hello@kairoria.com</p>
                    <p className="text-muted-foreground">support@kairoria.com</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-muted-foreground">Monday-Friday, 9am-5pm PT</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Office</h3>
                    <p className="text-muted-foreground">123 Sustainable St.</p>
                    <p className="text-muted-foreground">San Francisco, CA 94107</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Need Help Fast?</CardTitle>
              <CardDescription>
                Check our help center for immediate assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md flex items-start space-x-3">
                <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">FAQs</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Browse our extensive knowledge base for answers to common questions.
                  </p>
                  <Link href="/how-it-works#faq" className="text-sm text-primary flex items-center">
                    View FAQs
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md flex items-start space-x-3">
                <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Community</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Join our community forum to connect with other users and share experiences.
                  </p>
                  <Link href="/community" className="text-sm text-primary flex items-center">
                    Visit Community
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contact Form */}
        <Card>
          <CardContent className="p-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Select onValueChange={setSubject}>
                    <SelectTrigger id="topic">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    rows={6}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">
                        <svg className="h-5 w-5\" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </span>
                      Sending Message...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for contacting us. We'll get back to you as soon as possible.
                </p>
                <Button onClick={() => {
                  setName("")
                  setEmail("")
                  setSubject("")
                  setMessage("")
                  setIsSubmitted(false)
                }}>
                  Send Another Message
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Map Section */}
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="w-full h-[400px] rounded-lg overflow-hidden border relative">
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">
              Map component would load here showing the office location.
              <br />
              In a production app, this would integrate with Google Maps or Mapbox.
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <section className="mt-16 py-12 bg-muted/30 rounded-lg max-w-5xl mx-auto">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Connect with like-minded individuals who are passionate about sustainable consumption.
            Share ideas, get inspired, and be part of the change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button>
              Follow on Twitter
            </Button>
            <Button variant="outline">
              Join Our Newsletter
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}