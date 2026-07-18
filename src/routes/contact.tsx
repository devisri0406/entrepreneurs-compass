import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { submitContact } from "@/lib/contact.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Clock, MapPin, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(3, "Subject is too short").max(200),
  category: z.enum(["general", "support", "feedback", "partnership", "press"]),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});
type FormData = z.infer<typeof Schema>;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Startup Navigator — We'd Love to Hear From You" },
      { name: "description", content: "Reach out for support, partnerships, feedback, or press. We usually reply within one business day." },
      { property: "og:title", content: "Contact Startup Navigator" },
      { property: "og:description", content: "Get in touch with the Startup Navigator team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const info = [
  { icon: Mail, title: "Email", body: "hello@startupnavigator.app", note: "General inquiries" },
  { icon: MessageCircle, title: "Support", body: "Use the form below", note: "Product questions & bugs" },
  { icon: Clock, title: "Response time", body: "< 1 business day", note: "Monday–Friday" },
  { icon: MapPin, title: "Remote-first", body: "Distributed team", note: "Serving founders globally" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const submit = useServerFn(submitContact);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { category: "general" },
  });

  async function onSubmit(data: FormData) {
    try {
      await submit({ data });
      setSubmitted(true);
      reset();
      toast.success("Message sent — we'll be in touch soon!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 gradient-hero opacity-10" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
          <Badge variant="secondary" className="mb-4"><Sparkles className="mr-1.5 h-3 w-3" /> We'd love to hear from you</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Questions, feedback, partnership ideas — send us a note and we'll get back to you fast.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Info */}
          <div className="space-y-4">
            {info.map((i) => (
              <Card key={i.title} className="transition-all hover:shadow-elegant"><CardContent className="flex gap-4 p-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow"><i.icon className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{i.title}</div>
                  <div className="mt-0.5 truncate text-sm text-foreground/90">{i.body}</div>
                  <div className="text-xs text-muted-foreground">{i.note}</div>
                </div>
              </CardContent></Card>
            ))}
          </div>

          {/* Form */}
          <Card><CardContent className="p-6 md:p-8">
            {submitted ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold">Message received!</h2>
                <p className="mt-2 text-muted-foreground">Thanks for reaching out. We'll reply within one business day.</p>
                <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" {...register("name")} placeholder="Ada Lovelace" aria-invalid={!!errors.name} />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="ada@example.com" aria-invalid={!!errors.email} />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select id="category" {...register("category")}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="general">General</option>
                      <option value="support">Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" {...register("subject")} placeholder="How can we help?" aria-invalid={!!errors.subject} />
                    {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={6} {...register("message")} placeholder="Tell us a bit about what you're working on…" aria-invalid={!!errors.message} />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="gradient-hero text-primary-foreground shadow-glow">
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending…" : "Send message"}
                </Button>
                <p className="text-xs text-muted-foreground">By submitting, you agree to be contacted about your inquiry. We never share your details.</p>
              </form>
            )}
          </CardContent></Card>
        </div>
      </section>
    </div>
  );
}
