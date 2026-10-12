import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { OpenRouterConnection } from '@/components/OpenRouterConnection';
import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from '@/components/auth/DeleteAccountDialog';
import { accountUrl, ssoManaged } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function SettingsView() {
  const { user, resetPassword } = useAuth();
  const { toast } = useToast();
  return (
    <main className="min-h-full bg-adam-background-1 px-6 py-10 text-adam-neutral-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-medium">Configuración · MrBIM</h1>
          <p className="mt-2 text-sm text-adam-neutral-200">
            Tu cuenta y tu conexión de IA para generar componentes.
          </p>
        </header>
        <OpenRouterConnection />
        <section className="rounded-xl border border-adam-neutral-800 bg-adam-background-2 p-6">
          <h2 className="mb-3 font-medium">Cuenta</h2>
          <p className="mb-4 text-sm">{user?.email}</p>
          {ssoManaged ? (
            <a
              href={accountUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Administrar cuenta
            </a>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="dark"
                onClick={() => {
                  if (user?.email)
                    void resetPassword(user.email)
                      .then(() =>
                        toast({
                          title: 'Revisa tu correo',
                          description:
                            'Se enviaron instrucciones para cambiar la contraseña.',
                        }),
                      )
                      .catch(() =>
                        toast({
                          title: 'No se pudo enviar el correo',
                          variant: 'destructive',
                        }),
                      );
                }}
              >
                Cambiar contraseña
              </Button>
              <DeleteAccountDialog><Button variant="dark">Eliminar cuenta</Button></DeleteAccountDialog>
            </div>
          )}
        </section>
        <Link to="/" className="text-sm underline">
          Volver al generador
        </Link>
      </div>
    </main>
  );
}
