import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword(): JSX.Element {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Email requerido', description: 'Introduce tu correo para restablecer contraseña', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      // Supabase method to send password reset email
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // redirect the user to the reset page so the app can complete the recovery flow
        redirectTo: window.location.origin + '/reset-password',
      } as any);

      if (error) throw error;

      toast({ title: 'Correo enviado', description: 'Revisa tu email para restablecer la contraseña.' });
      setEmail('');
    } catch (err: any) {
      console.error('reset password error', err);
      toast({ title: 'Error', description: err.message || 'No se pudo enviar el correo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Mail className="w-5 h-5 text-blue-600" />Restablecer contraseña</h1>
        <p className="text-sm text-gray-600 mb-4">Introduce el correo asociado a tu cuenta y te enviaremos un enlace para restablecer la contraseña.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</Button>
            <Link to="/auth" className="text-sm text-blue-600 hover:underline">Volver a iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
