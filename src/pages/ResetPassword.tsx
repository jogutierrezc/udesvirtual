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
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        console.log('🔍 Reset Password - Full URL:', window.location.href);
        console.log('🔍 Reset Password - Hash:', window.location.hash);
        console.log('🔍 Reset Password - Search:', window.location.search);

        // Supabase can send tokens in different ways depending on configuration
        // Try parsing from hash first (most common with HashRouter)
        let accessToken = null;
        let refreshToken = null;
        let type = null;

        // Method 1: Parse from hash fragment (after #)
        const fullHash = window.location.hash;

        // Check if hash contains another # (format: #/reset-password#access_token=...)
        if (fullHash.includes('#', 1)) {
          const parts = fullHash.split('#');
          if (parts.length >= 3) {
            // Format: #/reset-password#access_token=...
            const tokenPart = parts.slice(2).join('#');
            const hashParams = new URLSearchParams(tokenPart);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
            type = hashParams.get('type');
            console.log('🔍 Parsing from nested hash (Method 1)');
          }
        }

        // Method 2: Parse from hash after route (format: #/reset-password?access_token=...)
        if (!accessToken && fullHash.includes('?')) {
          const queryStart = fullHash.indexOf('?');
          const queryString = fullHash.substring(queryStart + 1);
          const hashParams = new URLSearchParams(queryString);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          type = hashParams.get('type');
          console.log('🔍 Parsing from hash with query (Method 2)');
        }

        // Method 3: Parse from URL search params (format: ?access_token=...#/reset-password)
        if (!accessToken && window.location.search) {
          const searchParams = new URLSearchParams(window.location.search);
          accessToken = searchParams.get('access_token');
          refreshToken = searchParams.get('refresh_token');
          type = searchParams.get('type');
          console.log('🔍 Parsing from search params (Method 3)');
        }

        console.log('🔍 Parsed values:', {
          accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
          refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
          type
        });

        if (accessToken && type === 'recovery') {
          console.log('✅ Recovery token found! Setting session...');

          toast({
            title: 'Verificando enlace...',
            description: 'Procesando tu solicitud de recuperación.',
          });

          // Exchange the token for a session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('❌ Error setting session:', error);
            toast({
              title: 'Error',
              description: 'El enlace de recuperación es inválido o ha expirado.',
              variant: 'destructive'
            });
            setUserReady(false);
            return;
          }

          console.log('✅ Session set successfully!');

          // Now check if we have a valid user session
          const { data: { user } } = await supabase.auth.getUser();
          console.log('👤 User after setSession:', user ? user.email : 'null');

          if (user) {
            console.log('✅ User ready to reset password!');
            setUserReady(true);
            toast({
              title: 'Enlace verificado',
              description: 'Ya puedes cambiar tu contraseña.',
            });
          } else {
            console.log('❌ No user found after setting session');
            setUserReady(false);
          }
        } else {
          console.log('⚠️ No recovery token found in URL');
          // No recovery token found, check if user is already logged in
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('✅ User already logged in:', user.email);
            setUserReady(true);
          } else {
            console.log('❌ No user logged in and no recovery token');
            setUserReady(false);
          }
        }
      } catch (err) {
        console.error('❌ Reset init error:', err);
        setUserReady(false);
      } finally {
        setChecking(false);
      }
    })();
  }, [toast]);

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
        {checking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando enlace de recuperación...</p>
          </div>
        ) : !userReady ? (
          <div className="text-sm text-gray-600">
            <p className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              ⚠️ No se encontró un enlace de recuperación válido.
            </p>
            <p>Para cambiar la contraseña debes abrir el enlace de restablecimiento enviado a tu correo.</p>
            <p className="mt-2">Si no recibiste el correo, vuelve a solicitarlo desde la página de <a href="/#/forgot-password" className="text-blue-600 underline">Restablecer contraseña</a>.</p>
            <p className="mt-4 text-xs text-gray-500">💡 Tip: Abre la consola del navegador (F12) para ver más detalles técnicos.</p>
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
