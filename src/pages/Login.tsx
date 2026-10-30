import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast.success("Conta criada! Verifique seu email para confirmar.");
      } else {
        await signIn(email, password);
        toast.success("Login realizado!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  if (user && !authLoading) return <Navigate to="/orders" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🍔</div>
          <CardTitle className="text-2xl">DeMattos Lanches</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Criar nova conta" : "Entre no sistema"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                placeholder="Nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
