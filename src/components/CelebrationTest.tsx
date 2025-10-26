import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CelebrationTest() {
  const [userId, setUserId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('Not connected');

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    addLog('Setting up subscriptions for user:', userId);

    // Subscribe to points ledger changes
    const pointsSubscription = supabase
      .channel('points_test')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'passport_points_ledger',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addLog('🎉 POINTS CHANGE DETECTED:', JSON.stringify(payload, null, 2));
        }
      )
      .subscribe((status) => {
        setSubscriptionStatus(`Points subscription: ${status}`);
        addLog(`Points subscription status: ${status}`);
      });

    // Subscribe to badges changes
    const badgesSubscription = supabase
      .channel('badges_test')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'passport_user_badges',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addLog('🏆 BADGE CHANGE DETECTED:', JSON.stringify(payload, null, 2));
        }
      )
      .subscribe((status) => {
        addLog(`Badges subscription status: ${status}`);
      });

    return () => {
      pointsSubscription.unsubscribe();
      badgesSubscription.unsubscribe();
    };
  }, [userId]);

  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
    setTestResults(prev => [logEntry, ...prev.slice(0, 19)]); // Keep last 20 entries
  };

  const testPointsInsert = async () => {
    if (!userId) {
      addLog('❌ No user ID available');
      return;
    }

    try {
      addLog('📤 Attempting to insert points...');
      const { data, error } = await (supabase as any)
        .from('passport_points_ledger')
        .insert({
          user_id: userId,
          points: 10,
          pathway_type: 'conocimiento',
          reason: 'Test celebration'
        })
        .select();

      if (error) {
        addLog('❌ Error inserting points:', error);
      } else {
        addLog('✅ Points inserted successfully:', data);
      }
    } catch (err) {
      addLog('❌ Exception inserting points:', err);
    }
  };

  const testBadgeInsert = async () => {
    if (!userId) {
      addLog('❌ No user ID available');
      return;
    }

    try {
      addLog('📤 Attempting to insert badge...');
      // First get an available badge
      const { data: badges } = await (supabase as any)
        .from('passport_badges')
        .select('id, name')
        .limit(1);

      if (!badges || badges.length === 0) {
        addLog('❌ No badges available for testing');
        return;
      }

      const badgeId = badges[0].id;
      addLog(`📤 Using badge: ${badges[0].name} (${badgeId})`);

      const { data, error } = await (supabase as any)
        .from('passport_user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId
        })
        .select();

      if (error) {
        addLog('❌ Error inserting badge:', error);
      } else {
        addLog('✅ Badge inserted successfully:', data);
      }
    } catch (err) {
      addLog('❌ Exception inserting badge:', err);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const clearStoredData = () => {
    if (!userId) {
      addLog('❌ No user ID available');
      return;
    }

    localStorage.removeItem(`passport_last_points_${userId}`);
    localStorage.removeItem(`passport_last_badges_${userId}`);
    addLog('✅ LocalStorage limpiado - próxima visita mostrará popup de bienvenida');
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Prueba de Celebraciones en Tiempo Real</CardTitle>
          <CardDescription>
            Herramienta para probar el sistema de celebraciones: bienvenida al cargar página y tiempo real durante navegación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testPointsInsert} className="bg-blue-600 hover:bg-blue-700">
              🏆 Probar Puntos
            </Button>
            <Button onClick={testBadgeInsert} className="bg-green-600 hover:bg-green-700">
              🎖️ Probar Insignia
            </Button>
            <Button onClick={clearLogs} variant="outline">
              🗑️ Limpiar Logs
            </Button>
            <Button onClick={clearStoredData} variant="destructive">
              🔄 Reset Estado
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Estado: {subscriptionStatus}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">📋 Logs de Prueba:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No hay logs aún. Haz clic en un botón para empezar.</p>
            ) : (
              <div className="space-y-2 font-mono text-sm">
                {testResults.map((log, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <pre className="whitespace-pre-wrap">{log}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
            <strong>🧪 Cómo Probar el Sistema:</strong>
            <ul className="mt-1 space-y-1">
              <li>• <strong>Popup de Bienvenida:</strong> Limpia estado → agrega puntos → ve a /passport</li>
              <li>• <strong>Tiempo Real:</strong> Mantén /passport abierto → usa botones de prueba</li>
              <li>• <strong>Una Vez:</strong> Los popups no se repiten para el mismo evento</li>
              <li>• <strong>Cooldown:</strong> Después de 30s puedes ver nuevas celebraciones</li>
              <li>• <strong>Debugging:</strong> Revisa consola del navegador para logs detallados</li>
            </ul>
            <br />
            <strong>💡 Consejos de debugging:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Si no ves "SUBSCRIBED", verifica la conexión a internet</li>
              <li>• Si los inserts funcionan pero no se detectan, revisa las políticas RLS</li>
              <li>• Los logs de Supabase aparecen en la consola del servidor</li>
              <li>• Las suscripciones requieren reconexión si se pierde la conexión</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}