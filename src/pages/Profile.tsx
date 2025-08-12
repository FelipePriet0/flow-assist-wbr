
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("-");
  const [saving, setSaving] = useState(false);

  const email = user?.email ?? "-";
  const role = profile?.role ?? "-";

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  useEffect(() => {
    // Opcional: se seu perfil já armazena avatar_url (não tipado no Profile local),
    // tentamos ler direto para iniciar o estado do campo.
    // Se não existir a coluna, nada acontece.
    (async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url as string);
    })();
  }, [user?.id]);

  useEffect(() => {
    // Busca nome da empresa
    (async () => {
      if (!profile?.company_id) {
        setCompanyName("-");
        return;
      }
      const { data, error } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .maybeSingle();
      if (!error && data?.name) {
        setCompanyName(data.name);
      } else {
        setCompanyName("-");
      }
    })();
  }, [profile?.company_id]);

  const roleLabel = useMemo(() => {
    if (role === "analista_premium") return "Analista Premium";
    if (role === "reanalista") return "Reanalista";
    if (role === "comercial") return "Comercial";
    return "-";
  }, [role]);

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      toast({ title: "Perfil atualizado com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message ?? "Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você precisa estar autenticado para ver seu perfil.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seu perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={email} readOnly />
              </div>
              <div>
                <Label>Função</Label>
                <Input value={roleLabel} readOnly />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={companyName} readOnly />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="secondary" onClick={signOut}>
                Sair
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-2">
              Observação: upload de imagem de avatar será habilitado na próxima etapa (Storage).
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
