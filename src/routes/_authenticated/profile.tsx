import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateProfile } from "@/lib/user.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Startup Navigator" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const fn = useServerFn(updateProfile);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setFullName(data.full_name ?? ""); setBio(data.bio ?? ""); }
    });
  }, [user]);

  async function save() {
    try {
      await fn({ data: { full_name: fullName, bio } });
      toast.success("Profile updated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your account information.</p>

      <Card className="mt-6"><CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarFallback className="text-lg">{initial}</AvatarFallback></Avatar>
          <div>
            <div className="font-semibold">{user?.email}</div>
            <div className="text-sm text-muted-foreground">Signed in</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few words about yourself" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} className="gradient-hero text-primary-foreground shadow-glow">Save changes</Button>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
}
