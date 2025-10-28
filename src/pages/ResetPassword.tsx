import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userReady, setUserReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Try to exchange session from URL if present (some versions expose getSessionFromUrl)
        if ((supabase.auth as any).getSessionFromUrl) {
          try {
            await (supabase.auth as any).getSessionFromUrl();
          } catch (err) {
            // ignore
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserReady(true);
        } else {
          // Not signed in — instruct user to open the link from their email
          setUserReady(false);
        }
      } catch (err) {
        console.error('reset init error', err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({ title: 'Contraseña inválida', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Contraseñas no coinciden', description: 'Verifica que las contraseñas coincidan', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      // Update user password — the recovery flow should have established a session
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña se ha actualizado correctamente.' });
      navigate('/auth');
    } catch (err: any) {
      console.error('reset password error', err);
      toast({ title: 'Error', description: err.message || 'No se pudo actualizar la contraseña', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Cambiar contraseña</h1>
        {!userReady ? (
          <div className="text-sm text-gray-600">
            <p>Para cambiar la contraseña debes abrir el enlace de restablecimiento enviado a tu correo.</p>
            <p className="mt-2">Si no recibiste el correo, vuelve a solicitarlo desde la página de <a href="/forgot-password" className="text-blue-600 underline">Restablecer contraseña</a>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" />
            </div>
            <div>
              <Label>Confirma contraseña</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la contraseña" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar contraseña'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
