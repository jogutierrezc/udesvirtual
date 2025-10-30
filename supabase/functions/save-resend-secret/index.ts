import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { apiKey, link } = await req.json();
    // Guardar el secreto en Supabase Edge Function Secrets
    // Solo permitir si el usuario es admin (validar JWT si lo requieres)
    if (!apiKey || !link) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400 });
    }
    // Aquí deberías usar Deno.env.set, pero Supabase solo permite setear secrets desde el dashboard o CLI
    // Como alternativa, podrías guardar en una tabla segura o retornar el valor para que el admin lo registre manualmente
    // Ejemplo de respuesta:
    return new Response(JSON.stringify({ success: true, apiKey, link }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error al guardar el secreto" }), { status: 500 });
  }
});
